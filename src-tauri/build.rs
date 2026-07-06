fn main() {
    tauri_build::build();

    // Embed a build timestamp so the tray menu can show when this binary was
    // built (useful for distinguishing local/custom builds from official ones).
    // Force Asia/Shanghai (CST) so the timestamp matches the user's local
    // timezone regardless of the CI runner's default (GitHub Actions runners
    // default to UTC). Falls back to "unknown" if `date` isn't available.
    let build_time = std::process::Command::new("date")
        .env("TZ", "Asia/Shanghai")
        .args(["--iso-8601=seconds"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());
    println!("cargo:rustc-env=BUILD_TIME={build_time}");

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
