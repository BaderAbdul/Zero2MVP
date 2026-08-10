#!/bin/bash
agent-browser open --session org "http://localhost:3000/dev"
agent-browser eval --session org 'document.querySelector("button:contains(\"Organizer\")").click()'
agent-browser open --session org "http://localhost:3000/organizer"

agent-browser open --session part "http://localhost:3000/dev"
agent-browser eval --session part 'document.querySelector("button:contains(\"Participant (Team Nova)\")").click()'
agent-browser open --session part "http://localhost:3000/participant"

agent-browser open --session mentor "http://localhost:3000/dev"
agent-browser eval --session mentor 'document.querySelector("button:contains(\"Mentor\")").click()'
agent-browser open --session mentor "http://localhost:3000/mentor"

agent-browser open --session judge "http://localhost:3000/dev"
agent-browser eval --session judge 'document.querySelector("button:contains(\"Judge\")").click()'
agent-browser open --session judge "http://localhost:3000/judge"

agent-browser open --session proj "http://localhost:3000/projector"

echo "=== ORGANIZER ==="
agent-browser snapshot --session org

echo "=== PARTICIPANT ==="
agent-browser snapshot --session part

echo "=== MENTOR ==="
agent-browser snapshot --session mentor

echo "=== JUDGE ==="
agent-browser snapshot --session judge

echo "=== PROJECTOR ==="
agent-browser snapshot --session proj
