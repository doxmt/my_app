# 로그인 버튼 에셋 출처와 사용 규정

## 에셋

| 파일 | 출처 |
|---|---|
| `google_g.png` | Google 공식 G 로고. https://developers.google.com/identity/branding-guidelines |
| `github_invertocat_white.png`, `github_invertocat_black.png` | GitHub 공식 Invertocat. https://brand.github.com/GitHub_Logos.zip |
| `kakao_symbol.png`, `kakao_symbol.svg` | 카카오 공식 원본 PSD https://developers.kakao.com/tool/resource/static/img/button/login/kakao_login_original.psd 의 `국문 > Large and Narrow (600px X 90px) > Shape 2` 벡터 레이어를 SVG로 변환한 것. PNG는 SVG에서 만든 투명 배경·검정(#000000) 심볼. SVG는 코드에서 사용하지 않는다 |
| Apple | 별도 에셋 없음. `sign_in_with_apple` 패키지가 공개한 `AppleLogoPainter`로 로고를 그리는 커스텀 버튼(다른 버튼과 같은 배치) |

## 사용 규정 요약

- Google: 로고 변형 금지, 흑백 변환 금지, 표준 색 G 사용, 로고는 규정된 배경(라이트 흰색 / 다크 #131314) 위에 둔다.
- Kakao: 심볼의 형태·비율·색 변경 금지, 심볼 없는 버튼 금지. 컨테이너 #FEE500, 모서리 12, 문구는 "카카오 로그인" 등 가이드가 허용한 것만 쓴다.
- GitHub: 로고는 흰색/검정만 사용. 서면 허가 없이 변경하거나 다른 로고와 결합 금지. 그림자·그라디언트 금지, WCAG AA 대비 유지.
- Apple: HIG에 따라 밝은 배경엔 Black, 어두운 배경엔 White 스타일. 로고 크기는 공식 버튼 이미지 계측값(높이 44 기준 약 11x14)에 맞췄고, 글자 크기는 4개 버튼 통일을 위해 14(HIG 권장 43% ≈ 19)를 쓴다. 문구는 공식 한국어 sign-in 문구인 "Apple로 로그인".

## 규정에서 확인하지 못한 값

- Apple 버튼의 모서리 반경(공식 값 미확인, 8로 설정)
- GitHub 로고의 최소 여백, 공식 버튼 문구(버튼 규격 규정 없음, 문구·높이·여백은 제안값)
- Google 한국어 표시용 글꼴(공식 지정 미확인, 시스템 기본 서체 사용)
