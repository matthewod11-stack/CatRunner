#!/bin/bash
# Beach Kitty - Session Initialization Script
# Run at the start of each development session

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${YELLOW}BEACH KITTY${CYAN} - Roadmap Session Init                        ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

EXPECTED_DIR="catrunner"
CURRENT_DIR=$(basename "$PWD" | tr '[:upper:]' '[:lower:]')

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo -e "${RED}ERROR: Expected to be in CatRunner${NC}"
    echo "Current: $PWD"
    exit 1
fi
echo -e "${GREEN}✓${NC} Working directory: $PWD"

echo ""
echo -e "${BLUE}Checking canonical project files...${NC}"

find_active_roadmap() {
    local candidate

    for candidate in ROADMAP_*.md ROADMAP.md; do
        if [ -f "$candidate" ] && grep -q "\[ \]" "$candidate"; then
            echo "$candidate"
            return
        fi
    done

    for candidate in ROADMAP_*.md ROADMAP.md; do
        if [ -f "$candidate" ]; then
            echo "$candidate"
            return
        fi
    done
}

ACTIVE_ROADMAP="$(find_active_roadmap)"

REQUIRED_FILES=(
    "PROGRESS.md"
    "features.json"
    "package.json"
    "types.ts"
)

if [ -n "$ACTIVE_ROADMAP" ]; then
    REQUIRED_FILES=("$ACTIVE_ROADMAP" "${REQUIRED_FILES[@]}")
fi

MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗ MISSING: $file${NC}"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Warning: $MISSING required file(s) missing${NC}"
fi

echo ""
if [ -n "$ACTIVE_ROADMAP" ]; then
    echo -e "${GREEN}✓${NC} Active roadmap: $ACTIVE_ROADMAP"
else
    echo -e "${YELLOW}!${NC} No active root roadmap found"
fi

echo ""
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

echo ""
echo -e "${BLUE}Running verification...${NC}"

if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build passes"
else
    echo -e "${RED}✗${NC} Build FAILED - run 'npm run build' to see errors"
fi

echo ""
echo -e "${BLUE}═══ Feature Status ═══${NC}"
if [ -f "features.json" ]; then
    PASS=$(grep -c '"status": "pass"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")
    FAIL=$(grep -c '"status": "fail"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")
    IN_PROGRESS=$(grep -c '"status": "in-progress"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")
    NOT_STARTED=$(grep -c '"status": "not-started"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")

    echo -e "${GREEN}Pass:${NC} $PASS | ${RED}Fail:${NC} $FAIL | ${YELLOW}In Progress:${NC} $IN_PROGRESS | Not Started: $NOT_STARTED"
fi

echo ""
echo -e "${BLUE}═══ Recent Progress ═══${NC}"
if [ -f "PROGRESS.md" ]; then
    awk '/^## Session:/{if(found)exit; found=1} found && /^### Next Session Should/{p=1} p{print; if(/^$/ && p>1)exit; p++}' PROGRESS.md | head -10
fi

echo ""
echo -e "${BLUE}═══ Next Tasks ═══${NC}"
if [ -n "$ACTIVE_ROADMAP" ]; then
    grep -n "\[ \]" "$ACTIVE_ROADMAP" | head -5 | while read -r line; do
        echo -e "${YELLOW}○${NC} $(echo "$line" | cut -d']' -f2-)"
    done
else
    echo -e "${YELLOW}○${NC} Create the next root roadmap, expected: ROADMAP_CITYHEIGHTS.md"
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Ready to develop!${NC}"
echo ""
echo -e "${YELLOW}▶ ACTIVE ROADMAP:${NC} ${ACTIVE_ROADMAP:-none found - create ROADMAP_CITYHEIGHTS.md next}"
echo ""
echo -e "Quick commands:"
if [ -n "$ACTIVE_ROADMAP" ]; then
    echo -e "  ${YELLOW}sed -n '1,220p' $ACTIVE_ROADMAP${NC} - Read active roadmap"
fi
echo -e "  ${YELLOW}npm run dev${NC}          - Start dev server"
echo -e "  ${YELLOW}npm run test:run${NC}    - Vitest (CI-style)"
echo -e "  ${YELLOW}npm run build${NC}       - Build check"
echo -e "  ${YELLOW}npx tsc --noEmit${NC}    - Optional full TS check"
echo ""
