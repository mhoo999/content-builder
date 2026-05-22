import React from 'react';

/**
 * 저장 상태 표시 컴포넌트
 * React.memo로 감싸서 saveStatus가 변경될 때만 리렌더링
 */
const SaveStatusIndicator = React.memo(({ saveStatus }) => {
  return (
    <span className={`save-status ${saveStatus.includes("실패") || saveStatus.includes("불가") ? "error" : ""}`}>
      {saveStatus}
    </span>
  );
});

SaveStatusIndicator.displayName = 'SaveStatusIndicator';

export default SaveStatusIndicator;
