#!/bin/bash
# Beach Kitty Multi-Level System - Session Initialization Script
# Run at the start of each development session

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${YELLOW}BEACH KITTY${CYAN} - Multi-Level System Development              ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Confirm directory (case-insensitive check)
EXPECTED_DIR="catrunner"
CURRENT_DIR=$(basename "$PWD" | tr '[:upper:]' '[:lower:]')

if [ "$CURRENT_DIR" != "$EXPECTED_DIR" ]; then
    echo -e "${RED}ERROR: Expected to be in CatRunner${NC}"
    echo "Current: $PWD"
    exit 1
fi
echo -e "${GREEN}✓${NC} Working directory: $PWD"

# 2. Check required files
echo ""
echo -e "${BLUE}Checking project files...${NC}"

REQUIRED_FILES=(
    "docs/ROADMAP.md"
    "docs/PROGRESS.md"
    "docs/KNOWN_ISSUES.md"
    "features.json"
    "package.json"
    "types.ts"
)

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

# 3. Check plan file
PLAN_FILE="$HOME/.claude/plans/compressed-gathering-kite.md"
echo ""
if [ -f "$PLAN_FILE" ]; then
    echo -e "${GREEN}✓${NC} Plan file exists: $PLAN_FILE"
else
    echo -e "${YELLOW}!${NC} Plan file not found at: $PLAN_FILE"
fi

# 4. Install dependencies if needed
echo ""
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# 5. Run type check
echo ""
echo -e "${BLUE}Running verification...${NC}"

if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Build passes"
else
    echo -e "${RED}✗${NC} Build FAILED - run 'npm run build' to see errors"
fi

# 6. Show feature status
echo ""
echo -e "${BLUE}═══ Feature Status ═══${NC}"
if [ -f "features.json" ]; then
    # Count statuses (use tr to handle any whitespace issues)
    PASS=$(grep -c '"status": "pass"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")
    FAIL=$(grep -c '"status": "fail"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")
    IN_PROGRESS=$(grep -c '"status": "in-progress"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")
    NOT_STARTED=$(grep -c '"status": "not-started"' features.json 2>/dev/null | tr -d '[:space:]' || echo "0")

    echo -e "${GREEN}Pass:${NC} $PASS | ${RED}Fail:${NC} $FAIL | ${YELLOW}In Progress:${NC} $IN_PROGRESS | Not Started: $NOT_STARTED"

    # Show current phase
    CURRENT_PHASE=$(grep -B1 '"status": "in-progress"' features.json | grep '"phase-' | head -1 | sed 's/.*"phase-\([0-9]*\)".*/Phase \1/' || echo "Unknown")
    echo -e "Current: ${CYAN}$CURRENT_PHASE${NC}"
fi

# 7. Show recent progress
echo ""
echo -e "${BLUE}═══ Recent Progress ═══${NC}"
if [ -f "docs/PROGRESS.md" ]; then
    # Show the most recent session header and Next Session Should
    awk '/^## Session [0-9]/{if(found)exit; found=1} found && /^### Next Session Should/{p=1} p{print; if(/^$/ && p>1)exit; p++}' docs/PROGRESS.md | head -10
fi

# 8. Show next tasks from ROADMAP
echo ""
echo -e "${BLUE}═══ Next Tasks ═══${NC}"
if [ -f "docs/ROADMAP.md" ]; then
    grep -n "\[ \]" docs/ROADMAP.md | head -5 | while read line; do
        echo -e "${YELLOW}○${NC} $(echo $line | cut -d']' -f2-)"
    done
fi

# 9. Show known issues count
echo ""
if [ -f "docs/KNOWN_ISSUES.md" ]; then
    # Count actual issues (not format examples)
    OPEN_ISSUES=$(grep -c "^\*\*Status:\*\* Open$" docs/KNOWN_ISSUES.md 2>/dev/null | tr -d '[:space:]') || OPEN_ISSUES="0"
    BLOCKERS=$(grep -c "^\*\*Severity:\*\* Blocker$" docs/KNOWN_ISSUES.md 2>/dev/null | tr -d '[:space:]') || BLOCKERS="0"
    # Ensure they're valid numbers
    OPEN_ISSUES=${OPEN_ISSUES:-0}
    BLOCKERS=${BLOCKERS:-0}
    if [ "$BLOCKERS" -gt 0 ]; then
        echo -e "${RED}! $BLOCKERS BLOCKER(S) in KNOWN_ISSUES.md${NC}"
    elif [ "$OPEN_ISSUES" -gt 0 ]; then
        echo -e "${YELLOW}$OPEN_ISSUES open issue(s) in KNOWN_ISSUES.md${NC}"
    else
        echo -e "${GREEN}✓${NC} No blocking issues"
    fi
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Ready to develop!${NC}"
echo ""
echo -e "${YELLOW}▶ FULL PLAN:${NC} ~/.claude/plans/compressed-gathering-kite.md"
echo ""
echo -e "Quick commands:"
echo -e "  ${YELLOW}cat ~/.claude/plans/compressed-gathering-kite.md${NC} - Read full plan"
echo -e "  ${YELLOW}npm run dev${NC}      - Start dev server"
echo -e "  ${YELLOW}npm run build${NC}    - Type check & build"
echo ""
