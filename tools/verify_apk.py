"""Verify a built debug APK contains the exact current production web game."""
from pathlib import Path
import hashlib
import json
import zipfile
root = Path(__file__).resolve().parents[1]
apk = root / 'apps/android/android/app/build/outputs/apk/debug/app-debug.apk'
with zipfile.ZipFile(apk) as package:
    config = json.loads(package.read('assets/capacitor.config.json'))
    assert config['appId'] == 'com.pengin0503.pctycoon'
    assert not config.get('server', {}).get('url'), 'Native game must use bundled assets'
    files = [file for file in (root / 'dist').rglob('*') if file.is_file()]
    for file in files:
        path = 'assets/public/' + file.relative_to(root / 'dist').as_posix()
        assert package.read(path) == file.read_bytes(), f'Stale or missing APK asset: {path}'
    assert any(file.suffix == '.woff2' for file in files), 'Japanese font must be offline'
    assert package.read('classes.dex'), 'Native code is missing'
print(f'APK verified: {len(files)} current web assets; no remote server; SHA256 {hashlib.sha256(apk.read_bytes()).hexdigest()}')
