import Link from "next/link";
import { LegalDocument, LegalSection, TransferTable } from "@/components/legal-document";

/** 개인정보처리방침(초안). */
export function PrivacyView() {
  return (
    <LegalDocument title="개인정보처리방침">
      <LegalSection heading="1. 총칙">
        <p>
          개인 개발자 송태하(이하 &quot;운영자&quot;)는 DevInterview(이하 &quot;서비스&quot;)를
          제공하면서 이용자의 개인정보를 소중히 다루며, 개인정보 보호법 등 관련 법령을 따릅니다. 이 방침은 서비스가
          어떤 정보를 어떤 목적으로 처리하고, 누구에게 맡기며, 언제 파기하는지 알려 드립니다.
        </p>
      </LegalSection>

      <LegalSection heading="2. 수집하는 항목">
        <ul>
          <li>
            <strong>비회원(로그인 없이 이용)</strong>: 기기 ID(앱·웹이 처음 실행될 때 만든 임의의 값, 요청 헤더
            X-Device-Id)와 IP 주소의 해시값. 하루 사용량 한도를 계산하는 데에만 쓰며(서버 테이블
            guest_daily_usage), 이 값으로 개인의 학습 기록을 조회하지 않습니다.
          </li>
          <li>
            <strong>비회원의 학습 기록·이력서·면접 대화</strong>: 이용자 기기에만 저장되며 운영자의 서버에 저장하지
            않습니다. 다만 모의면접을 이용하면 아래 4항에 따라 입력한 내용이 AI 응답 생성을 위해 전송됩니다.
          </li>
          <li>
            <strong>소셜 로그인 회원</strong>: 카카오·구글·깃허브(iOS 앱은 Apple 로그인 포함)에서 제공하는 프로필
            정보(이름 또는 닉네임, 이메일, 프로필 이미지 등). 제공 항목은 소셜 로그인 제공자의 동의 화면과 설정에 따라
            다르며, 카카오는 이메일 없이도 가입할 수 있습니다.
          </li>
          <li>
            <strong>회원이 입력·생성한 콘텐츠</strong>: 오답노트, 이력서(텍스트·PDF에서 추출한 텍스트), 자기소개,
            채용공고, 모의면접 대화. 서비스의 데이터베이스(서버)에 저장됩니다.
          </li>
          <li>
            <strong>음성 입력을 사용할 때</strong>: 마이크 오디오는 이용자 기기의 운영체제·브라우저 음성 인식 기능이
            처리합니다(5항 참조). 운영자의 서버로 오디오를 보내지 않습니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. 이용 목적">
        <ul>
          <li>문제풀이·오답노트·이력서 저장 등 서비스 기능 제공</li>
          <li>이력서와 채용공고를 바탕으로 한 AI 모의면접 응답 생성</li>
          <li>회원 식별과 로그인, 비회원 기기·IP별 일일 사용량 한도 계산 및 서비스 남용 방지</li>
        </ul>
      </LegalSection>

      <LegalSection heading="4. 개인정보 처리위탁 및 국외 이전">
        <p>
          운영자는 서비스 제공을 위해 아래 업체에 개인정보 처리를 맡기며, 이 과정에서 개인정보가 국외로 이전됩니다.
          국외 이전 고지 사항(개인정보 보호법 제28조의8)을 업체별로 정리했습니다. 법적 성격(처리위탁 또는 제3자
          제공)은 검토 후 확정하며, 이 초안에서는 &quot;처리위탁&quot;으로 적었습니다.
        </p>

        <TransferTable
          name="OpenAI (AI 모의면접 응답 생성)"
          rows={[
            {
              label: "이전하는 항목",
              value: "모의면접에서 입력한 이력서, 채용공고, 자기소개, 면접 대화 내용",
            },
            {
              label: "이전 국가·시기·방법",
              value:
                "미국. 모의면접 메시지를 보낼 때마다. 운영자의 서버(Supabase Edge Function)에서 암호화된 통신(HTTPS)으로 전송합니다.",
            },
            {
              label: "이전받는 자(명칭·연락처)",
              value: "OpenAI OpCo, LLC (미국) · dsar@openai.com, privacy.openai.com",
            },
            {
              label: "이용 목적·보유기간",
              value:
                "모의면접 AI 응답 생성. API로 보낸 데이터는 기본 설정상 모델 학습에 사용되지 않으며, 악용 모니터링을 위한 로그가 최대 30일 보관될 수 있습니다.",
            },
            {
              label: "거부 방법·절차·효과",
              value:
                "모의면접을 시작하기 전 동의 화면에서 \"동의하지 않음\"을 선택하면 전송되지 않습니다. 동의하지 않으면 모의면접은 이용할 수 없지만 문제풀이 등 다른 기능은 그대로 이용할 수 있습니다.",
            },
          ]}
        />

        <TransferTable
          name="Supabase (데이터베이스·인증)"
          rows={[
            {
              label: "이전하는 항목",
              value:
                "회원: 로그인 계정 정보와 프로필, 오답노트, 이력서, 자기소개, 채용공고, 면접 대화. 비회원: 기기 ID·IP 해시 기반 일일 사용량 카운터만(이력서·대화 내용은 보내지 않음).",
            },
            {
              label: "이전 국가·시기·방법",
              value: "일본(도쿄, ap-northeast-1). 서비스를 이용하는 동안 수시로, 암호화된 통신(HTTPS)으로 전송·저장됩니다.",
            },
            {
              label: "이전받는 자(명칭·연락처)",
              value: "Supabase Pte. Ltd. · privacy@supabase.com",
            },
            {
              label: "이용 목적·보유기간",
              value:
                "회원 데이터 저장과 로그인 인증, 사용량 한도 계산. 회원 데이터는 탈퇴 요청 시 지체 없이 파기합니다. 비회원 사용량 카운터는 일 단위로 집계하며 30일이 지나면 자동으로 삭제합니다.",
            },
            {
              label: "거부 방법·절차·효과",
              value:
                "비회원으로 이용하면 이력서·학습 기록이 서버에 저장되지 않습니다(사용량 카운터는 한도 계산에 필요해 제외할 수 없습니다). 회원가입을 하지 않거나 탈퇴하면 회원 데이터는 저장되지 않습니다.",
            },
          ]}
        />

        <TransferTable
          name="Vercel (웹 호스팅·이력서 PDF 텍스트 추출)"
          rows={[
            {
              label: "이전하는 항목",
              value:
                "웹 접속 시의 요청 정보(IP 주소 등 접속 기록), 이력서 PDF를 불러올 때 PDF 파일 내용. PDF 본문과 추출된 텍스트는 저장하지 않고 추출 결과만 응답으로 돌려줍니다.",
            },
            {
              label: "이전 국가·시기·방법",
              value: "미국(기본 리전 iad1). 웹 이용 및 PDF 불러오기 시마다, 암호화된 통신(HTTPS)으로 전송됩니다.",
            },
            {
              label: "이전받는 자(명칭·연락처)",
              value: "Vercel Inc. (미국) · privacy@vercel.com",
            },
            {
              label: "이용 목적·보유기간",
              value:
                "웹 서비스 제공과 PDF 텍스트 추출. PDF 내용은 처리 후 보관하지 않으며, 접속 기록은 Vercel의 정책에 따라 일정 기간 보관될 수 있습니다.",
            },
            {
              label: "거부 방법·절차·효과",
              value:
                "PDF를 올리지 않으면 PDF 내용은 전송되지 않습니다. 이 경우 PDF 불러오기는 이용할 수 없지만 이력서 텍스트 붙여넣기는 가능합니다. 웹 접속 자체의 전송은 웹 서비스 이용에 필요합니다.",
            },
          ]}
        />

        <TransferTable
          name="Apple·Google 등 기기 음성 인식 (음성 입력 사용 시)"
          rows={[
            {
              label: "이전하는 항목",
              value: "음성 입력 버튼을 눌러 말한 음성(오디오). 운영자의 서버로는 보내지 않습니다.",
            },
            {
              label: "이전 국가·시기·방법",
              value:
                "기기 운영체제·브라우저의 음성 인식 엔진이 처리하며, 이 과정에서 Apple(iOS 기기), Google(Chrome 등 브라우저) 서버로 전송될 수 있습니다. 국가는 해당 업체의 정책에 따르며, 음성 입력을 사용할 때마다 발생합니다.",
            },
            {
              label: "이전받는 자(명칭·연락처)",
              value:
                "Apple, Google 등 이용자 기기의 음성 인식 제공자 · Apple: apple.com/legal/privacy/contact, Google: support.google.com/policies/contact/general_privacy_form",
            },
            {
              label: "이용 목적·보유기간",
              value: "말한 내용을 글자로 바꾸는 것. 보유기간은 각 제공자의 정책에 따릅니다.",
            },
            {
              label: "거부 방법·절차·효과",
              value:
                "음성 입력 버튼을 누르지 않으면 되며, 이 경우 음성 입력만 이용할 수 없고 키보드 입력은 그대로 가능합니다.",
            },
          ]}
        />
      </LegalSection>

      <LegalSection heading="5. 소셜 로그인 제공자">
        <p>
          회원가입과 로그인은 카카오, 구글, 깃허브(iOS 앱은 Apple 포함)의 소셜 로그인으로 이뤄지며, 이 제공자들이
          이용자의 인증 정보를 처리합니다. 각 제공자에서 제공하는 정보의 범위는 해당 제공자의 동의 화면에서 확인할 수
          있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="6. 보유 및 파기">
        <ul>
          <li>
            회원 데이터(프로필, 오답노트, 이력서, 자기소개, 채용공고, 면접 대화)는 회원탈퇴 시 지체 없이 파기합니다.
            앱의 내 정보·설정 화면 또는 웹의 내 정보에서 회원탈퇴를 누르면 바로 처리됩니다.
          </li>
          <li>비회원의 학습 기록·이력서·면접 대화는 이용자 기기에만 있으므로, 앱 삭제 또는 브라우저 데이터 삭제로 지울 수 있습니다.</li>
          <li>
            비회원 사용량 카운터(기기 ID·IP 해시)는 일 단위로 집계하며 30일이 지나면 자동으로 삭제합니다.
          </li>
          <li>법령에 따라 보관해야 하는 정보가 있으면 해당 기간 동안 분리하여 보관한 뒤 파기합니다.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="7. 정보주체의 권리">
        <p>
          이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요구하고 동의를 철회할 수 있습니다.
          요청은 아래 보호책임자 연락처로 하실 수 있으며, 운영자는 지체 없이 조치합니다. OpenAI 전송 동의는 앱·웹에서
          모의면접을 이용하지 않는 방식으로 거부할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="8. 개인정보 보호책임자">
        <ul>
          <li>
            운영자 겸 보호책임자: 송태하 (개인 개발자)
          </li>
          <li>
            연락처(이메일): songtaeha@naver.com
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="9. 방침의 변경">
        <p>이 방침이 바뀌면 시행 전에 서비스 내 공지 등으로 알립니다. 서비스 이용약관은 <Link href="/terms">이용약관</Link>에서 볼 수 있습니다.</p>
      </LegalSection>
    </LegalDocument>
  );
}
