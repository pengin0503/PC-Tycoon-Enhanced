"""Parse the authoritative value of a preference from Android aapt XML output."""
import re

def preference_is_false(xml: str, name: str) -> bool:
    for block in re.split(r'\bE:\s+preference\b', xml)[1:]:
        block = block.split('E:', 1)[0]
        if not re.search(r'\bname[^=\n]*=[^\n]*"' + re.escape(name) + r'"', block):
            continue
        value = re.search(r'\bvalue[^=\n]*=([^\n]*)', block)
        if value is None:
            return False
        return bool(re.match(r'\s*(?:"false"|\(type 0x12\)\s*0x0\b)', value.group(1)))
    return False
