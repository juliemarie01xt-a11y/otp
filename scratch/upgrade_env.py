import os

file_path = ".env.local"
if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        code = f.read()

    code = code.replace("otp-three-liard.vercel.app", "swiftotp.store")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(".env.local upgraded!")
