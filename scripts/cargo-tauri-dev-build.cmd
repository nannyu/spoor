@echo off
REM Build Tauri crate with MSVC env + LIBCLANG_PATH (for llama-cpp-sys / bindgen).
REM Requires .llvm-min\bin\libclang.dll (+ LLVM-C.dll); see .gitignore for local extract.

set "ROOT=%~dp0.."
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" || exit /b 1
set "LIBCLANG_PATH=%ROOT%\.llvm-min\bin"
if not exist "%LIBCLANG_PATH%\libclang.dll" (
  echo ERROR: libclang.dll not found at %LIBCLANG_PATH%
  echo Extract from LLVM-*-win64.exe: bin\libclang.dll and bin\LLVM-C.dll into .llvm-min\bin
  exit /b 1
)
cd /d "%ROOT%\src-tauri" || exit /b 1
cargo build %*
