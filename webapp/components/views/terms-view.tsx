import Link from "next/link";
import { LegalDocument, LegalSection } from "@/components/legal-document";

/** 이용약관(초안). */
export function TermsView() {
  return (
    <LegalDocument title="이용약관">
      <LegalSection heading="1. 서비스 내용">
        <p>
          DevInterview(이하 &quot;서비스&quot;)는 개발자 기술면접을 준비하는 서비스로, 분야별 서술형 문제풀이, 오답노트,
          이력서 기반 AI 모의면접을 제공합니다. 운영자는 개인 개발자 송태하입니다. 서비스는
          앱(Android·iOS)과 웹으로 제공되며, 기능은 사전 안내 후 바뀌거나 중단될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="2. AI 응답에 관한 안내">
        <p>
          AI 모의면접의 질문과 답변은 인공지능이 생성하며, 부정확하거나 사실과 다를 수 있습니다. 면접 합격이나 특정
          결과를 보장하지 않으며, 이용자는 AI 응답을 참고용으로 활용하고 스스로 확인해야 합니다. AI 응답을 근거로 한
          판단과 결과에 대한 책임은 이용자에게 있습니다. 모의면접에 입력한 내용이 OpenAI(미국)로 전송되는 점은{" "}
          <Link href="/privacy">개인정보처리방침</Link>과 모의면접 시작 전 동의 화면에서 안내합니다.
        </p>
      </LegalSection>

      <LegalSection heading="3. 사용량 한도">
        <p>
          서비스는 안정적인 운영과 남용 방지를 위해 AI 모의면접 등의 일일 사용량에 한도를 둡니다. 회원은 계정별로,
          비회원은 기기별·IP별로 한도가 적용되며, 한도는 서비스가 정하고 운영 상황에 따라 바뀔 수 있습니다. 한도를
          넘으면 그날은 해당 기능을 더 이용할 수 없습니다.
        </p>
      </LegalSection>

      <LegalSection heading="4. 계정 및 탈퇴">
        <ul>
          <li>회원가입은 카카오·구글·깃허브(iOS 앱은 Apple 포함) 소셜 로그인으로 합니다. 비회원도 로그인 없이 서비스를 이용할 수 있습니다.</li>
          <li>이용자는 자신의 계정을 직접 관리해야 하며, 타인에게 양도하거나 빌려줄 수 없습니다.</li>
          <li>
            회원은 언제든지 탈퇴할 수 있습니다. 앱의 내 정보·설정 화면 또는 웹의 내 정보에서 회원탈퇴를 누르면 바로
            처리되고, 탈퇴하면 회원 데이터는 지체 없이 파기합니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. 금지 행위">
        <ul>
          <li>서비스를 자동화된 수단으로 과도하게 호출하거나 사용량 한도를 우회하는 행위</li>
          <li>서비스·서버·계정에 무단으로 접근하거나 정상적인 운영을 방해하는 행위</li>
          <li>타인의 개인정보나 권리를 침해하는 내용, 불법적이거나 유해한 내용을 입력하는 행위</li>
          <li>서비스의 문제·해설 등 콘텐츠를 허락 없이 복제·배포하거나 영리 목적으로 이용하는 행위</li>
        </ul>
        <p>금지 행위가 확인되면 운영자는 이용을 제한할 수 있습니다.</p>
      </LegalSection>

      <LegalSection heading="6. 개인정보">
        <p>
          개인정보의 처리에 관한 내용은 <Link href="/privacy">개인정보처리방침</Link>을 따릅니다.
        </p>
      </LegalSection>

      <LegalSection heading="7. 약관의 변경">
        <p>약관이 바뀌면 시행 전에 서비스 내 공지 등으로 알립니다.</p>
      </LegalSection>

      <LegalSection heading="8. 문의">
        <ul>
          <li>
            이메일: songtaeha@naver.com
          </li>
        </ul>
      </LegalSection>
    </LegalDocument>
  );
}
