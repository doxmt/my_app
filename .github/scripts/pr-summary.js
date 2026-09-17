// PR 하나에 CI·배포 결과를 한글 댓글 하나로 모아 보여준다.
// ci.yml(CI 결과)과 pr-deploy.yml(Vercel deployment_status)이 같은 댓글을 갱신한다.
const fs = require('fs');

const MARKER = '<!-- pr-summary -->';

function readState(body) {
  const match = body && body.match(/<!-- state:([A-Za-z0-9+/=]+) -->/);
  if (!match) return {};
  try {
    return JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

function render(state) {
  const { ci, deploy, prod } = state;

  const ciPart = !ci ? '⏳ CI 실행 중' : ci.ok ? '✅ CI 통과' : '❌ CI 실패';
  const deployPart =
    !deploy || deploy.state === 'pending'
      ? '⏳ 배포 중'
      : deploy.state === 'success'
        ? '🚀 배포 완료'
        : '❌ 배포 실패';

  const detail = [];
  if (ci) {
    detail.push(`분석 ${ci.analyze ? '✓' : '✗'}`);
    const t = ci.tests;
    if (t && t.failed) detail.push(`테스트 ${t.failed}개 ✗`);
    else if (t) detail.push(`테스트 ${t.passed}개 ${ci.testOk ? '✓' : '✗'}`);
    else detail.push(`테스트 ${ci.testOk ? '✓' : '✗'}`);
  }
  if (state.sha) detail.push(`\`${state.sha.slice(0, 7)}\``);
  if (ci && ci.url) detail.push(`[로그](${ci.url})`);
  if (deploy && deploy.state === 'success' && deploy.url) detail.push(`[미리보기](${deploy.url})`);
  if (deploy && deploy.state === 'failure' && deploy.logUrl) detail.push(`[배포 로그](${deploy.logUrl})`);

  const lines = [`**${ciPart} · ${deployPart}**`, detail.join(' · ')];

  if (prod) {
    if (prod.state === 'success') lines.push(`🚀 운영 배포 완료 · [사이트](${prod.url})`);
    else if (prod.state === 'failure') lines.push(`❌ 운영 배포 실패 · [배포 로그](${prod.logUrl})`);
    else lines.push('⏳ 운영 배포 중');
  }

  return lines.filter(Boolean).join('\n');
}

function toBody(state) {
  const encoded = Buffer.from(JSON.stringify(state), 'utf8').toString('base64');
  return `${MARKER}\n${render(state)}\n<!-- state:${encoded} -->`;
}

async function upsert({ github, context, prNumber, sha, patch }) {
  const comments = await github.paginate(github.rest.issues.listComments, {
    ...context.repo,
    issue_number: prNumber,
    per_page: 100,
  });
  const existing = comments.find((c) => c.body && c.body.startsWith(MARKER));

  let state = readState(existing && existing.body);
  // 새 커밋이면 이전 커밋의 CI·배포 결과는 버린다.
  if (sha && state.sha !== sha) state = { prod: state.prod, sha };
  Object.assign(state, patch);

  const body = toBody(state);
  if (existing) {
    await github.rest.issues.updateComment({ ...context.repo, comment_id: existing.id, body });
  } else {
    await github.rest.issues.createComment({ ...context.repo, issue_number: prNumber, body });
  }
  return state;
}

function parseTests(log) {
  // 이전 형식: "00:01 +9: All tests passed!" / "00:02 +7 -2: Some tests failed."
  const matches = [...log.matchAll(/\+(\d+)(?: ~\d+)?(?: -(\d+))?: (?:All tests passed|Some tests failed)/g)];
  const last = matches[matches.length - 1];
  if (last) return { passed: Number(last[1]), failed: Number(last[2] || 0) };

  // 새 형식: "🎉 9 tests passed." / "7 tests passed, 2 failed."
  const passed = log.match(/(\d+) tests? passed/);
  const failed = log.match(/(\d+) (?:tests? )?failed/);
  if (!passed && !failed) return null;
  return { passed: Number(passed ? passed[1] : 0), failed: Number(failed ? failed[1] : 0) };
}

async function reportCi({ github, context, core }) {
  const analyze = process.env.ANALYZE_OUTCOME === 'success';
  const testOk = process.env.TEST_OUTCOME === 'success';
  let log = '';
  try {
    log = fs.readFileSync(process.env.TEST_LOG || 'test.log', 'utf8');
  } catch {
    // 테스트 단계가 실행되지 않았으면 로그가 없다.
  }

  const ci = {
    ok: analyze && testOk,
    analyze,
    testOk,
    tests: parseTests(log),
    url: `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
  };

  const pr = context.payload.pull_request;
  const state = pr
    ? await upsert({ github, context, prNumber: pr.number, sha: pr.head.sha, patch: { ci } })
    : { sha: context.sha, ci };
  await core.summary.addRaw(render(state)).write();
}

async function reportDeploy({ github, context, core }) {
  const { deployment, deployment_status: status } = context.payload;
  const state =
    status.state === 'success'
      ? 'success'
      : ['failure', 'error'].includes(status.state)
        ? 'failure'
        : 'pending';
  const result = {
    state,
    url: status.environment_url || status.target_url,
    logUrl: status.log_url || status.target_url,
  };
  const isProd = /production/i.test(deployment.environment);

  const { data: prs } = await github.rest.repos.listPullRequestsAssociatedWithCommit({
    ...context.repo,
    commit_sha: deployment.sha,
  });

  if (isProd) {
    const pr = prs.find((p) => p.merged_at);
    if (pr) await upsert({ github, context, prNumber: pr.number, patch: { prod: result } });
    else await core.summary.addRaw(render({ sha: deployment.sha, prod: result })).write();
    return;
  }

  // 열린 PR의 최신 커밋 배포만 반영한다.
  const pr = prs.find((p) => p.state === 'open' && p.head.sha === deployment.sha);
  if (!pr) return;
  await upsert({ github, context, prNumber: pr.number, sha: deployment.sha, patch: { deploy: result } });
}

module.exports = { reportCi, reportDeploy, render, parseTests, readState, toBody };
