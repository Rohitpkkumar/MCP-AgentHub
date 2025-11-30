# tools/manifest_signer.py
import json, argparse
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import HexEncoder

def canonical_json(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def gen_keys():
    sk = SigningKey.generate()
    vk = sk.verify_key
    print("Private key (keep secret):", sk.encode(HexEncoder).decode())
    print("Public key:", vk.encode(HexEncoder).decode())

def sign(manifest_path, priv_hex):
    sk = SigningKey(priv_hex, encoder=HexEncoder)
    manifest = json.load(open(manifest_path))
    mjson = canonical_json(manifest).encode()
    sig = sk.sign(mjson).signature.hex()
    manifest["signature"] = sig
    manifest["pubkey"] = sk.verify_key.encode(HexEncoder).decode()
    out = manifest_path.replace(".json", "_signed.json")
    json.dump(manifest, open(out, "w"), indent=2)
    print(f"Signed manifest written to {out}")

def verify(manifest_path):
    m = json.load(open(manifest_path))
    sig_hex = m.pop("signature")
    pub_hex = m.pop("pubkey")  # remove pubkey before verification
    vk = VerifyKey(pub_hex, encoder=HexEncoder)
    vk.verify(canonical_json(m).encode(), bytes.fromhex(sig_hex))
    print("✅ Signature valid")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd")
    sub.add_parser("gen-keys")
    s = sub.add_parser("sign"); s.add_argument("manifest"); s.add_argument("privkey")
    v = sub.add_parser("verify"); v.add_argument("manifest")
    a = p.parse_args()
    if a.cmd=="gen-keys": gen_keys()
    elif a.cmd=="sign": sign(a.manifest,a.privkey)
    elif a.cmd=="verify": verify(a.manifest)
    else: p.print_help()
