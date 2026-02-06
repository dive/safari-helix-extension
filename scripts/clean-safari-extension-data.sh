#!/usr/bin/env bash
set -euo pipefail

EXTENSION_ID="im.justsitandgrin.Shelix.Extension"
HOST_APP_ID="${EXTENSION_ID%.Extension}"
SAFARI_LIBRARY_ROOT="${SAFARI_LIBRARY_ROOT:-$HOME/Library/Containers/com.apple.Safari/Data/Library}"
HOME_LIBRARY_ROOT="${HOME_LIBRARY_ROOT:-$HOME/Library}"
DRY_RUN=0
FORCE=0

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Clean Safari WebExtension state for one extension ID only.

Options:
  --extension-id <id>  Extension bundle ID (default: ${EXTENSION_ID})
  --host-app-id <id>   Host app bundle ID (default: ${HOST_APP_ID})
  --dry-run            Print planned actions without changing anything
  --force              Continue even if Safari is currently running
  -h, --help           Show this help

Examples:
  $(basename "$0")
  $(basename "$0") --dry-run
  $(basename "$0") --extension-id com.example.MyExtension
  $(basename "$0") --extension-id com.example.MyExtension --host-app-id com.example.MyHost
USAGE
}

log() {
  printf '%s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

run_trash() {
  local path="$1"

  if [[ ! -e "$path" ]]; then
    return 0
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] trash \"$path\""
    return 0
  fi

  trash "$path"
  log "Trashed: $path"
}

remove_plist_key() {
  local plist="$1"
  local key="$2"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] delete plist key '$key' from '$plist'"
    return 0
  fi

  /usr/libexec/PlistBuddy -c "Delete :\"$key\"" "$plist" >/dev/null
  log "Removed plist key: $key"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --extension-id)
      if [[ $# -lt 2 ]]; then
        log "Missing value for --extension-id"
        exit 1
      fi
      EXTENSION_ID="$2"
      HOST_APP_ID="${EXTENSION_ID%.Extension}"
      shift 2
      ;;
    --host-app-id)
      if [[ $# -lt 2 ]]; then
        log "Missing value for --host-app-id"
        exit 1
      fi
      HOST_APP_ID="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      log "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

require_cmd plutil
require_cmd trash
require_cmd awk
require_cmd find

if [[ "$FORCE" -ne 1 ]]; then
  if pgrep -x Safari >/dev/null 2>&1; then
    log "Safari is running. Quit Safari first, or rerun with --force."
    exit 1
  fi
fi

EXTENSION_ID_PREFIX="$EXTENSION_ID"
WEBEXT_PLIST="$SAFARI_LIBRARY_ROOT/Safari/WebExtensions/Extensions.plist"

log "Target extension: $EXTENSION_ID"
log "Target host app: $HOST_APP_ID"
log "Safari library root: $SAFARI_LIBRARY_ROOT"
log "Home library root: $HOME_LIBRARY_ROOT"

removed_keys=0
if [[ -f "$WEBEXT_PLIST" ]]; then
  while IFS= read -r key; do
    [[ -z "$key" ]] && continue
    if [[ "$removed_keys" -eq 0 && "$DRY_RUN" -ne 1 ]]; then
      backup_path="${WEBEXT_PLIST}.bak.$(date +%Y%m%d-%H%M%S)"
      cp "$WEBEXT_PLIST" "$backup_path"
      log "Backed up plist: $backup_path"
    fi
    remove_plist_key "$WEBEXT_PLIST" "$key"
    removed_keys=$((removed_keys + 1))
  done < <(
    plutil -p "$WEBEXT_PLIST" 2>/dev/null \
      | awk -v id="$EXTENSION_ID_PREFIX" '
          $0 ~ /^[[:space:]]*"/ && $0 ~ /=>/ {
            key = $0
            sub(/^[[:space:]]*"/, "", key)
            sub(/".*/, "", key)
            if (index(key, id) == 1) {
              print key
            }
          }
        '
  )
else
  log "Extensions plist not found: $WEBEXT_PLIST"
fi

trashed_paths=0
if [[ -d "$SAFARI_LIBRARY_ROOT" ]]; then
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    # Skip the main plist: keys are removed in place to avoid affecting other extensions.
    if [[ "$path" == "$WEBEXT_PLIST" ]]; then
      continue
    fi
    run_trash "$path"
    trashed_paths=$((trashed_paths + 1))
  done < <(
    find "$SAFARI_LIBRARY_ROOT" -mindepth 1 -name "*${EXTENSION_ID_PREFIX}*" -print 2>/dev/null | sort -u
  )
else
  log "Safari library root not found: $SAFARI_LIBRARY_ROOT"
fi

declare -a home_targets=(
  "$HOME_LIBRARY_ROOT/WebKit/$EXTENSION_ID"
  "$HOME_LIBRARY_ROOT/WebKit/$HOST_APP_ID"
  "$HOME_LIBRARY_ROOT/Caches/$EXTENSION_ID"
  "$HOME_LIBRARY_ROOT/Caches/$HOST_APP_ID"
  "$HOME_LIBRARY_ROOT/Containers/$EXTENSION_ID"
  "$HOME_LIBRARY_ROOT/Containers/$HOST_APP_ID"
  "$HOME_LIBRARY_ROOT/Application Scripts/$EXTENSION_ID"
  "$HOME_LIBRARY_ROOT/Application Scripts/$HOST_APP_ID"
  "$HOME_LIBRARY_ROOT/Preferences/$EXTENSION_ID.plist"
  "$HOME_LIBRARY_ROOT/Preferences/$HOST_APP_ID.plist"
)

for path in "${home_targets[@]}"; do
  [[ -z "$path" ]] && continue
  if [[ -e "$path" ]]; then
    run_trash "$path"
    trashed_paths=$((trashed_paths + 1))
  fi
done

log "Done. Removed plist keys: $removed_keys; trashed paths: $trashed_paths"
