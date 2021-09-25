import styled from "@emotion/styled";
import "./App.css";
import { HoverScrollBar } from "./hover-scroll";
import React from "react";

const Wrap = styled.div`
  border: 1px solid #999999;
  display: block;
  height: 300px;
  overflow: hidden;
  position: relative;
  width: 200px;
  margin: 0 auto;

  .list-wrap {
    display: grid;
    grid-auto-rows: 30px;
    row-gap: 5px;
    text-align: left;
    padding: 5px;

    .list-item {
      white-space: nowrap;
    }
  }
`;

function App() {
  const lists = new Array(30)
    .fill("example list item")
    .map((v, i) => (i === 0 ? `${v}${v}-${i}` : `${v}-${i}`));

  return (
    <div className="App">
      <Wrap>
        <HoverScrollBar>
          <div className="list-wrap">
            {lists.map((v, i) => (
              <div className="list-item" key={v}>
                {v}
              </div>
            ))}
          </div>
        </HoverScrollBar>
      </Wrap>
    </div>
  );
}

export default App;
