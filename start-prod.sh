#!/bin/zsh
# Mission Control 프로덕션 서버 기동 스크립트 (launchd가 KeepAlive로 감시)
# 포트 3005 고정. hermes CLI 경로를 페페 챗 API에 주입.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export PORT=3005
export HERMES_BIN="/Users/labo/.hermes/hermes-agent/venv/bin/hermes"
export PEPE_MODEL="claude-sonnet-5"
export PEPE_PROVIDER="anthropic"
export VAULT_PATH="/Users/labo/My_vault"
export REDDIT_SNIPER_PATH="/Users/labo/reddit-demand-sniper"
export NODE_ENV=production
cd /Users/labo/mission-control
exec npm run start
