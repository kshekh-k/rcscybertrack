#!/usr/bin/env python3
import os
import sys
import hashlib
import re
from pathlib import Path
import pycdlib

def sanitize_iso_component(name: str, is_file: bool = False) -> str:
    # ISO9660 level 3 component: uppercase letters, numbers, underscores
    sanitized = re.sub(r'[^A-Z0-9_]', '_', name.upper())
    if not sanitized:
        sanitized = "FILE" if is_file else "DIR"
    if is_file:
        return f"{sanitized[:30]}.;1"
    return sanitized[:31]

def build_iso(rootfs_dir: str, output_iso: str):
    print(f"[*] Building ISO image from {rootfs_dir} -> {output_iso}")
    
    iso = pycdlib.PyCdlib()
    iso.new(interchange_level=3, rock_ridge='1.12', joliet=3)

    rootfs_path = Path(rootfs_dir).resolve()
    iso_dirs = {"/": "/"}  # maps rel_dir_path -> iso9660_path

    # Sort directory traversal for deterministic ordering
    for root, dirs, files in os.walk(rootfs_path):
        dirs.sort()
        files.sort()
        rel_root = os.path.relpath(root, rootfs_path)
        
        if rel_root == ".":
            curr_rel = "/"
            curr_iso = "/"
        else:
            curr_rel = "/" + rel_root.replace("\\", "/")
            # Build ISO9660 directory path
            parts = [p for p in curr_rel.split("/") if p]
            curr_iso = ""
            parent_rel = ""
            for part in parts:
                parent_rel += "/" + part
                if parent_rel not in iso_dirs:
                    parent_iso = iso_dirs["/".join(parent_rel.split("/")[:-1]) or "/"]
                    iso_part = sanitize_iso_component(part, is_file=False)
                    target_iso = (parent_iso.rstrip("/") + "/" + iso_part)
                    
                    # Avoid ISO name collisions
                    idx = 1
                    base_target = target_iso
                    while target_iso in iso_dirs.values():
                        target_iso = f"{base_target}_{idx}"
                        idx += 1
                        
                    try:
                        iso.add_directory(rr_name=part, iso_path=target_iso)
                    except Exception as e:
                        pass
                    iso_dirs[parent_rel] = target_iso
            curr_iso = iso_dirs[curr_rel]

        # Add files in current directory
        used_file_iso_paths = set()
        for f in files:
            file_path = os.path.join(root, f)
            if os.path.islink(file_path):
                continue  # Skip symlinks for flat ISO file addition or resolve them
                
            iso_filename = sanitize_iso_component(f, is_file=True)
            iso_file_path = (curr_iso.rstrip("/") + "/" + iso_filename)
            
            idx = 1
            base_iso_path = iso_file_path
            while iso_file_path in used_file_iso_paths:
                name_part, ext_part = base_iso_path.split(".;1")[0], ".;1"
                iso_file_path = f"{name_part[:25]}_{idx}{ext_part}"
                idx += 1
            used_file_iso_paths.add(iso_file_path)

            try:
                iso.add_file(file_path, rr_name=f, iso_path=iso_file_path)
            except Exception as e:
                # If error occurs on individual file, fallback gracefully
                pass

    output_path = Path(output_iso).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    iso.write(str(output_path))
    iso.close()

    sha256_hash = hashlib.sha256()
    with open(output_path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
            
    sha256_val = sha256_hash.hexdigest()
    checksum_file = str(output_path) + ".sha256"
    with open(checksum_file, "w") as f:
        f.write(f"{sha256_val}  {output_path.name}\n")

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"[+] ISO Build Complete!")
    print(f"    Artifact: {output_path}")
    print(f"    Size:     {size_mb:.2f} MB")
    print(f"    SHA256:   {sha256_val}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: make_iso.py <rootfs_dir> <output_iso>")
        sys.exit(1)
    build_iso(sys.argv[1], sys.argv[2])
