"use strict";

const easeInOutQuad = require("./util").easeInOutQuad;

function moveTabs(direction) {
  const checkedVisibleTabs = this.menuData.checkedVisibleTabs;
  const lastTabIndex = this.orderedTabObjects.length - 1;
  const numHiddenTabs =
    this.orderedTabObjects.length - this.visibleTabIds.length;
  const movedTabFilterOffset = direction === "bottom" ? numHiddenTabs * -46 : 0;
  let numCheckedAbove = 0;
  let numUncheckedAbove = 0;
  let blockIndex = 0;
  let lastVisibleIsChecked = false;
  const tabRowHeight = 46;

  // get info about tabs
  this.moveState = {
    checkedVisibleTabs,
    direction,
    animation: null,
    animationStart: null,
    previousTimeStamp: null,
    animationElapsed: null,
    animationDuration: 4200,
    blocks: [],
    getMoveDistance(block) {
      let progress = Math.min(
        1,
        this.animationElapsed / this.animationDuration
      );
      let prevDistanceMoved = block.totalDistanceMoved;

      block.totalDistanceMoved = easeInOutQuad(
        progress,
        0,
        block.totalDistanceToMove,
        1
      );
      block.distanceToMoveInOneFrame =
        block.totalDistanceMoved - prevDistanceMoved;

      return block.distanceToMoveInOneFrame;
    },
    step: function (timestamp) {
      // console.log(this);
      // if (this.dragState === null) return;
      if (this.moveState.animationStart === null) {
        this.moveState.animationStart = timestamp;
      }

      // animationElapsed is the same for all blocks
      this.moveState.animationElapsed =
        timestamp - this.moveState.animationStart;

      if (this.moveState.previousTimeStamp !== timestamp) {
        this.moveState.previousTimeStamp = timestamp;
        // getMoveDistance for each block
        // console.log(this);

        if (this.moveState.animation) {
          // console.log(this);
          this.moveState.blocks.forEach(block => {
            const moveDistance = this.moveState.getMoveDistance(block);
            block.tabs.forEach(tab => {
              tab.style.setProperty(
                "--y-offset",
                block.totalDistanceMoved + "px"
              );
            });
          });
          // dragTab.call(this, { distance: dragDistance });
        }
      }

      if (this.moveState.animationElapsed >= this.moveState.animationDuration) {
        this.moveState.animation = null;
      }

      if (this.moveState.animation) {
        window.requestAnimationFrame(this.moveState.step);
      } else {
        this.moveState.checkedVisibleTabs.forEach(tab => {
          tab.classList.remove("tab--banana");
          tab.style.setProperty("--y-offset", 0 + "px");
        });
        this.moveState.moveTabsInTheDOM(
          this.moveState.checkedVisibleTabs,
          this.moveState.direction
        );
      }
    }.bind(this),
    moveTabsInTheDOM: function (tabsToMove) {
      const fragmentOfChecked = document.createDocumentFragment();

      tabsToMove.forEach(tab => {
        fragmentOfChecked.appendChild(tab);
      });

      if (this.moveState.direction === "bottom") {
        const lastIndex = this.orderedTabObjects.length - 1;

        this.tabList.insertBefore(
          fragmentOfChecked,
          this.tabs[lastIndex].nextSibling
        );
      } else {
        this.tabList.insertBefore(fragmentOfChecked, this.tabList.firstChild);
      }

      this.tabs = [...this.tabList.children];

      this.visibleTabIds.forEach(id => {
        const index = this.tabIndices[id][0];
        const tab = this.tabs[index];
        if (this.filterState.tabs[id]) {
          tab.style.setProperty(
            "--y-offset",
            this.filterState.tabs[id].filterOffset + "px"
          );
        }
      });
    }.bind(this)
  };
  const reorderedVisibleTabIds = [];
  const reorderedTabObjects = [];

  this.orderedTabObjects.forEach((obj, index) => {
    const id = obj.id;

    if (direction === "bottom") {
      // if tab is visible
      if (this.tabIndices[id][1] !== null) {
        this.moveState[id] = {};
        // if tab is NOT checked
        if (obj.isChecked === false) {
          this.tabIndices[id] = [
            this.tabIndices[id][0] - numCheckedAbove,
            this.tabIndices[id][1] - numCheckedAbove
          ];
          this.moveState[id].distance = numCheckedAbove * tabRowHeight * -1;
          numUncheckedAbove += 1;
          lastVisibleIsChecked = false;
          blockIndex += 1;
        } else {
          // if tab IS checked
          const numCheckedBelow =
            this.menuData.numChecked - numCheckedAbove - 1;
          const numUncheckedBelow =
            this.menuData.numUnchecked - numUncheckedAbove;

          const visibleTopPos = this.tabIndices[id][1] * tabRowHeight;
          const tab = this.tabs[index];
          tab.classList.add("tab--banana");

          this.tabIndices[id] = [
            lastTabIndex - numCheckedBelow,
            this.tabIndices[id][1] + numUncheckedBelow
          ];
          if (this.filterState.tabs[id]) {
            this.filterState.tabs[id].filterOffset = movedTabFilterOffset;
          }

          if (lastVisibleIsChecked === false) {
            const uncheckedTabsBelow = this.menuData.uncheckedVisibleTabs.slice(
              numUncheckedBelow * -1
            );
            const block = {
              height: tabRowHeight,
              bottomPos: visibleTopPos + tabRowHeight,
              totalDistanceToMove: numUncheckedBelow * tabRowHeight,
              totalDistanceMoved: 0,
              distanceToMoveInOneFrame: 0,
              tabs: [tab],
              uncheckedTabsBelow: uncheckedTabsBelow
            };
            this.moveState.blocks[blockIndex] = block;
            // blockIndex += 1;
          } else {
            this.moveState.blocks[blockIndex].tabs.push(tab);
            this.moveState.blocks[blockIndex].height += tabRowHeight;
            this.moveState.blocks[blockIndex].bottomPos += tabRowHeight;
          }

          numCheckedAbove += 1;
          lastVisibleIsChecked = true;
        }
        reorderedVisibleTabIds[this.tabIndices[id][1]] = id;
      } else {
        // if tab is hidden
        this.tabIndices[id][0] -= numCheckedAbove;
      }
    } else {
      // if tab is visible
      if (this.tabIndices[id][1] !== null) {
        this.moveState[id] = {};
        // if tab is NOT checked
        if (obj.isChecked === false) {
          const numCheckedBelow = this.menuData.numChecked - numCheckedAbove;
          this.tabIndices[id] = [
            this.tabIndices[id][0] + numCheckedBelow,
            this.tabIndices[id][1] + numCheckedBelow
          ];
          this.moveState[id].distance = numCheckedBelow * tabRowHeight;
          numUncheckedAbove += 1;
        } else {
          // if tab IS checked
          this.tabIndices[id] = [numCheckedAbove, numCheckedAbove];

          if (this.filterState.tabs[id]) {
            this.filterState.tabs[id].filterOffset = 0;
          }
          this.moveState[id].distance = numUncheckedAbove * tabRowHeight * -1;
          numCheckedAbove += 1;
        }
        reorderedVisibleTabIds[this.tabIndices[id][1]] = id;
      } else {
        // if tab is hidden
        const numCheckedBelow = this.menuData.numChecked - numCheckedAbove;
        this.tabIndices[id][0] += numCheckedBelow;
      }
    }
    reorderedTabObjects[this.tabIndices[id][0]] = obj;
  });

  // console.log(this.orderedTabObjects);
  // console.log(reorderedTabObjects);
  // console.log(moveState);

  // const getMoveDistance = block => {
  //   let progress = Math.min(1, this.animationElapsed / this.animationDuration);
  //   let prevDistanceMoved = block.totalDistanceMoved;

  //   block.totalDistanceMoved = easeInOutQuad(
  //     progress,
  //     0,
  //     block.totalDistanceToMove,
  //     1
  //   );
  //   block.distanceToMoveInOneFrame =
  //     block.totalDistanceMoved - prevDistanceMoved;

  //   return block.distanceToMoveInOneFrame;
  // };

  // at first, try to move checked tabs only, without animating surrounding tabs

  // const nstep = step.bind(moveState);
  this.moveState.animation = window.requestAnimationFrame(this.moveState.step);

  // animateMovement.call(moveState);

  // move tabs in the DOM
  // const moveTabsInTheDOM = (tabsToMove, direction) => {
  //   const fragmentOfChecked = document.createDocumentFragment();

  //   tabsToMove.forEach(tab => {
  //     fragmentOfChecked.appendChild(tab);
  //   });

  //   if (direction === "bottom") {
  //     const lastIndex = this.orderedTabObjects.length - 1;

  //     this.tabList.insertBefore(
  //       fragmentOfChecked,
  //       this.tabs[lastIndex].nextSibling
  //     );
  //   } else {
  //     this.tabList.insertBefore(fragmentOfChecked, this.tabList.firstChild);
  //   }

  //   this.tabs = [...this.tabList.children];

  //   this.visibleTabIds.forEach(id => {
  //     const index = this.tabIndices[id][0];
  //     const tab = this.tabs[index];
  //     if (this.filterState.tabs[id]) {
  //       tab.style.setProperty(
  //         "--y-offset",
  //         this.filterState.tabs[id].filterOffset + "px"
  //       );
  //     }
  //   });
  // };

  // moveTabsInTheDOM(checkedVisibleTabs, direction);
  this.orderedTabObjects = reorderedTabObjects;
  this.visibleTabIds = reorderedVisibleTabIds;
}

module.exports = moveTabs;
