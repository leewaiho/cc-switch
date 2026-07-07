const CST_OFFSET_SECONDS: i64 = 8 * 60 * 60;
const SECONDS_PER_DAY: i64 = 24 * 60 * 60;

fn main() {
    tauri_build::build();

    // Embed a build timestamp so the tray menu can show when this binary was
    // built (useful for distinguishing local/custom builds from official ones).
    // Use an internal UTC+8 formatter instead of shelling out to date:
    // Windows GitHub runners can ignore POSIX TZ=Asia/Shanghai and still emit
    // +00:00, while the tray build stamp must be stable across runners.
    let build_time = cst_build_time();
    println!("cargo:rustc-env=BUILD_TIME={build_time}");

    // Embed the git commit id so tray build info can be traced back to the
    // exact source revision used by local and CI builds.
    let build_commit = std::process::Command::new("git")
        .args(["rev-parse", "--short=8", "HEAD"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "unknown".to_string());
    println!("cargo:rustc-env=BUILD_COMMIT={build_commit}");

    // Embed the build hostname (max 10 chars) so the tray menu can show where
    // this binary was built. Falls back to "unknown" if hostname isn't available.
    let build_host = std::process::Command::new("hostname")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "unknown".to_string());
    let build_host = if build_host.chars().count() > 10 {
        build_host.chars().take(10).collect::<String>()
    } else {
        build_host
    };
    println!("cargo:rustc-env=BUILD_HOST={build_host}");

    // Windows: Embed Common Controls v6 manifest for test binaries
    //
    // When running `cargo test`, the generated test executables don't include
    // the standard Tauri application manifest. Without Common Controls v6,
    // `tauri::test` calls fail with STATUS_ENTRYPOINT_NOT_FOUND.
    //
    // This workaround:
    // 1. Embeds the manifest into test binaries via /MANIFEST:EMBED
    // 2. Uses /MANIFEST:NO for the main binary to avoid duplicate resources
    //    (Tauri already handles manifest embedding for the app binary)
    #[cfg(target_os = "windows")]
    {
        let manifest_path = std::path::PathBuf::from(
            std::env::var("CARGO_MANIFEST_DIR").expect("missing CARGO_MANIFEST_DIR"),
        )
        .join("common-controls.manifest");
        let manifest_arg = format!("/MANIFESTINPUT:{}", manifest_path.display());

        println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
        println!("cargo:rustc-link-arg={}", manifest_arg);
        // Avoid duplicate manifest resources in binary builds.
        println!("cargo:rustc-link-arg-bins=/MANIFEST:NO");
        println!("cargo:rerun-if-changed={}", manifest_path.display());
    }
}

fn cst_build_time() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
        + CST_OFFSET_SECONDS;
    let days = now.div_euclid(SECONDS_PER_DAY);
    let seconds_of_day = now.rem_euclid(SECONDS_PER_DAY);
    let (year, month, day) = civil_from_days(days);
    let hour = seconds_of_day / 3600;
    let minute = (seconds_of_day % 3600) / 60;
    let second = seconds_of_day % 60;

    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}+08:00")
}

fn civil_from_days(days_since_unix_epoch: i64) -> (i32, u32, u32) {
    // Howard Hinnant's civil calendar conversion. Input day 0 is 1970-01-01.
    let z = days_since_unix_epoch + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = mp + if mp < 10 { 3 } else { -9 };
    let year = y + if m <= 2 { 1 } else { 0 };

    (year as i32, m as u32, d as u32)
}
