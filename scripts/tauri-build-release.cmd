@echo off
REM Production Tauri bundle: MSVC + CMake (from vcvars) + libclang for bindgen.
set "ROOT=%~dp0.."
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" || exit /b 1
set "LIBCLANG_PATH=%ROOT%\.llvm-min\bin"
if not exist "%LIBCLANG_PATH%\libclang.dll" (
  echo ERROR: libclang.dll not found at %LIBCLANG_PATH%
  echo Extract bin\libclang.dll and bin\LLVM-C.dll from LLVM-*-win64.exe into .llvm-min\bin
  exit /b 1
)
cd /d "%ROOT%" || exit /b 1
call npm run tauri -- build %*
exit /b %ERRORLEVEL%
