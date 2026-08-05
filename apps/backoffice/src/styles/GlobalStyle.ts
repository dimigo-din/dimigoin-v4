import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

  *, *::before, *::after {
    box-sizing: border-box;
    list-style: none;
    margin: 0;
    padding: 0;

    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    
    -webkit-tap-highlight-color: transparent;

    text-decoration: none;
  }

  html, body {
    margin: 0;
    padding: 0;

    font-size: 16px;
    font-family: Pretendard, sans-serif;
  }
  
  a {
    color: inherit;
    text-decoration: none;
  }

  img, svg {
    display: block;
    max-width: 100%;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }
`;

export default GlobalStyle;
