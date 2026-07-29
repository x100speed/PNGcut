/**
 * 한국어 (Korean) 언어 팩
 */
export default {
  // 제목과 설명
  title: 'PNG 분할 도구',
  subtitle:
    '선택적 크로마키 후 투명 영역별로 PNG를 직사각형으로 분할(이미 투명한 이미지는 바로 분할)',
  
  // 버튼 텍스트
  selectImage: 'PNG 이미지 선택',
  processing: '처리 중...',
  downloadAll: '모두 다운로드',
  downloadComponent: '컴포넌트 다운로드',
  
  // 오류 메시지
  errorInvalidFormat: 'PNG 형식의 이미지를 업로드해주세요!',
  errorNoComponents: 'UI 컴포넌트가 감지되지 않았습니다! 이미지에 불투명 영역이 포함되어 있는지 확인하세요.',
  errorProcessFailed: '이미지 처리 실패: ',
  errorLoadFailed: '이미지 로드 실패, 파일이 손상되었는지 확인하세요',
  errorReadFailed: '파일 읽기 실패',
  errorNoImages: '다운로드할 이미지가 없습니다!',
  errorPickColor: '크로마키가 켜져 있습니다. 왼쪽 이미지에서 배경색을 하나 이상 클릭하세요.',
  chromaSectionTitle: '크로마키 및 미리보기',
  chromaOptionalNote:
    'PNG에 이미 투명이 있으면 크로마키를 끄고 분할하세요. 불투명 배경은 켜고 색을 선택하세요(여러 번 클릭해 다중 색 가능).',
  chromaEnable: '크로마키 사용(불투명 배경 제거)',
  pickColorTitle: '배경색 선택',
  pickColorHint:
    '제거할 배경 색을 클릭. 여러 번 클릭해 여러 색을 추가할 수 있습니다. 비슷한 색은 기존 샘플을 갱신합니다.',
  pickColorDisabled: '끄면 원본 표시. 켜면 색을 선택할 수 있습니다.',
  previewTitle: '미리보기',
  previewResult: '키잉 결과',
  previewMask: '매트',
  advancedTitle: '고급',
  advancedIntro:
    '배경 유사도 → 내부 보호 → 가장자리 부드러움 → 스필 보정 → 약한 알파 제거/수축 순입니다. 피사체와 배경 색이 비슷하면 보호 브러시를 함께 쓰세요.',
  advancedGroupMatch: '샘플링·색 일치',
  advancedGroupEdge: '가장자리·투명도 전환',
  advancedGroupSpill: '스필 제거(색 번짐)',
  advancedGroupDefringe: '흰 테두리 제거(약한 알파/수축)',
  tolerance: '색 허용 오차',
  toleranceDesc:
    '어느 샘플 배경색과도 이 거리 안이면 투명 처리합니다. 크면 과하게 잘리고, 작으면 배경이 남을 수 있습니다.',
  protectInterior: '내부 보호(연결 키잉)',
  protectInteriorDesc:
    '화면 가장자리와 연결된 배경만 제거합니다. 내부 동색(흰 옷 등)은 투명해지지 않습니다. 보통 켜 두세요.',
  enclosedMin: '폐쇄 영역 제거 임계값',
  enclosedMinDesc:
    '가장자리와 연결되지 않은 내부 동색 구멍(겨드랑이 틈 등)은 면적이 이 픽셀 수 이상일 때만 제거합니다. 클수록 내부를 보호하고, 0이면 후보를 모두 제거합니다.',
  softness: '페더(px)',
  softnessDesc:
    '경계 근처에서 불투명→투명으로 바뀌는 폭(px). 클수록 부드럽습니다. 「가장자리 페더」를 켠 경우에만 적용됩니다.',
  edgeSmooth: '가장자리 페더',
  edgeSmoothDesc: '끄면 경계가 딱 잘립니다. 켜면 페더 반경으로 알파 전환을 부드럽게 합니다.',
  edgeRadius: '가장자리 반경',
  edgeRadiusDesc:
    '스필 보정을 고려하는 범위(px). 투명 윤곽에 가까울수록 배경색 번짐을 더 줄입니다.',
  despill: '스필 제거',
  despillDesc:
    '배경색이 피사체 가장자리에 배는 현상(그린 스크린 등)을 줄입니다. 끄면 색 보정 없음.',
  despillStrength: '스필 강도',
  despillStrengthDesc: '보정 세기. 너무 높으면 가장자리가 회색빛으로 부자연스러울 수 있습니다.',
  defringe: '흰 테두리 완전 제거',
  defringeDesc:
    '반투명 픽셀의 배경 혼색 제거, 옅은 잔영 컷, 가장자리 수축을 수행합니다. 윤곽이 깎이면 수축을 0으로 하세요.',
  erodePx: '가장자리 수축',
  erodePxDesc:
    '불투명 영역을 0~3px 안쪽으로 침식. 1px면 AA 흰 테두리를 줄이기 쉽고, 너무 크면 윤곽이 깎입니다.',
  alphaCutoff: '약한 알파 제거',
  alphaCutoffDesc:
    '이 임계값 미만 알파를 완전 투명으로 바꿔 페더 잔영을 제거합니다. 너무 크면 가장자리가 딱딱해집니다.',
  sampleRadius: '색 샘플 반경',
  sampleRadiusDesc:
    '클릭 주변을 평균해 배경 샘플을 만듭니다. 약간 크면 노이즈에 강하지만 너무 크면 피사체 색이 섞일 수 있습니다.',
  runSplit: '분할 실행',
  runSplitAgain: '다시 분할',
  colorPicked: '배경 샘플',
  clearAllSamples: '모두 지우기',
  removeSample: '이 색 삭제',
  brushProtect: '보호 브러시(칠한 영역은 원본 유지)',
  brushDiameter: '브러시 직경',
  brushClear: '칠 지우기',
  brushHint:
    '키잉 결과 보기에서 잘못 투명해진 부분을 칠해 원본으로 복원. 마스크 보기에서는 브러시 비활성. 샘플 변경 시 칠이 지워집니다.',
  
  // 미리보기 및 결과
  resultsTitle: '분할 결과',
  resultsDescription: '각 UI 컴포넌트가 자동으로 식별되어 투명한 배경을 가진 독립적인 PNG 이미지로 분할되었습니다.',
  identifiedComponents: '식별된',
  components: '개의 독립적인 UI 컴포넌트',
  
  // 이미지 정보
  component: '컴포넌트',
  size: '크기',
  position: '위치',
  pixels: '픽셀',
  
  // 로딩 메시지
  processingImage: '이미지 처리 중...',
}



