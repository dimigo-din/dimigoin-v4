import styled from "styled-components";

import DimigoinLoading from "../assets/icons/dimigoin_loading.svg?react";

const Page = styled.div`
  height: 100%;
  width: 100%;
  
  display: flex;
  justify-content: center;
  align-items: center;
`;

function Loading() {
  return (
    <Page>
      <DimigoinLoading />
    </Page>
  );
}

export default Loading;
