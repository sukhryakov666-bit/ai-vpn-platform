.PHONY: up down dev lint test wireguard-smoke release-guard alert-test-pagerduty alert-test-opsgenie alert-test-warning alert-evidence alert-evidence-pass alert-evidence-fail alert-evidence-sync alert-evidence-verdict

EVIDENCE_FILE ?= docs/runbooks/evidence/staging-alert-validation-final-2026-04-19.md

up:
	docker compose up -d

down:
	docker compose down

dev:
	pnpm dev

lint:
	pnpm lint

test:
	pnpm test

wireguard-smoke:
	./infra/scripts/wireguard-smoke.sh

release-guard:
	./infra/scripts/check-release-guards.sh "$(EVIDENCE_FILE)"

alert-test-pagerduty:
	./infra/scripts/trigger-alertmanager-test.sh critical pagerduty observability "$(EVIDENCE_FILE)"

alert-test-opsgenie:
	./infra/scripts/trigger-alertmanager-test.sh critical opsgenie observability "$(EVIDENCE_FILE)"

alert-test-warning:
	./infra/scripts/trigger-alertmanager-test.sh warning none observability "$(EVIDENCE_FILE)"

alert-evidence:
	./infra/scripts/new-alert-evidence.sh "$(EVIDENCE_FILE)"

# Usage:
# make alert-evidence-pass REQUEST_ID=staging-... INCIDENT_URL=https://... RESOLVED=yes
alert-evidence-pass:
	./infra/scripts/update-alert-evidence.sh "$(EVIDENCE_FILE)" "$(REQUEST_ID)" PASS "$(INCIDENT_URL)" "$(RESOLVED)"

# Usage:
# make alert-evidence-fail REQUEST_ID=staging-... INCIDENT_URL=https://... RESOLVED=no
alert-evidence-fail:
	./infra/scripts/update-alert-evidence.sh "$(EVIDENCE_FILE)" "$(REQUEST_ID)" FAIL "$(INCIDENT_URL)" "$(RESOLVED)"

# Usage:
# make alert-evidence-sync REQUEST_ID=staging-... INCIDENT_URL=https://... [RESULT=PASS|FAIL|SENT]
alert-evidence-sync:
	./infra/scripts/sync-alert-evidence.sh "$(EVIDENCE_FILE)" "$(REQUEST_ID)" "$(INCIDENT_URL)" "$(RESULT)"

alert-evidence-verdict:
	./infra/scripts/recompute-alert-evidence-verdict.sh "$(EVIDENCE_FILE)"
