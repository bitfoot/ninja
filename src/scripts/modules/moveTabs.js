"use strict";

import { disableHeaderControls } from "./util";
import { resetTabCSSVariables } from "./util";

function moveTabs(destinaton) {
  const tabHeight = 40;
  const margin = 6;
  const tabRowHeight = tabHeight + margin;
  const checkedVisibleTabs = this.menu.checkedVisibleTabs;
  const lastTabIndex = this.orderedTabObjects.length - 1;
  let lastPinnedTabIndex = this.menu.lastPinnedTabIndex;
  let lastUnpinnedTabIndex = null;
  if (lastPinnedTabIndex !== lastTabIndex) {
    lastUnpinnedTabIndex = lastTabIndex;
  }
  // console.log(`last pinned tab index is ${lastPinnedTabIndex}`);

  // let numPinnedTabs = 0;
  // if (this.menu.lastCheckedPinnedIndex !== null) {
  //   numPinnedTabs = this.menu.lastCheckedPinnedIndex + 1;
  // }

  const checkedVisiblePinnedTabs = [];
  const checkedVisibleUnpinnedTabs = [];
  const visibleTabs = [];
  let numPinned = 0;
  let numUnpinned = 0;
  let numCheckedPinned = 0;
  let numCheckedUnpinned = 0;
  let lastVisiblePinnedTabId = null;
  let lastVisibleUnpinnedTabId = null;
  let tabIndexToInsertPinnedBefore = null;

  // console.log(this.visibleTabIds);

  for (let index = 0; index < this.visibleTabIds.length; index++) {
    const id = this.visibleTabIds[index];
    // console.log(`id: ${id}`);
    const browserIndex = this.tabIndices[id][0];
    const isPinned = this.orderedTabObjects[browserIndex].isPinned === true;
    const isChecked = this.orderedTabObjects[browserIndex].isChecked === true;
    const tab = this.tabs[browserIndex];
    visibleTabs[index] = tab;

    if (isPinned === true) {
      numPinned += 1;
      lastVisiblePinnedTabId = id;
      if (isChecked === true) {
        checkedVisiblePinnedTabs[numCheckedPinned] = tab;
        numCheckedPinned += 1;
      }
    } else {
      numUnpinned += 1;
      lastVisibleUnpinnedTabId = id;
      if (isChecked === true) {
        checkedVisibleUnpinnedTabs[numCheckedUnpinned] = tab;
        numCheckedUnpinned += 1;
      }
    }
  }

  const numUncheckedPinned = numPinned - numCheckedPinned;
  const numUncheckedUnpinned = numUnpinned - numCheckedUnpinned;
  let lastVisiblePinnedTabFilterOffset = 0;
  let lastVisibleUnpinnedTabFilterOffset = 0;
  if (this.filterState.tabs[lastVisiblePinnedTabId]) {
    lastVisiblePinnedTabFilterOffset = this.filterState.tabs[
      lastVisiblePinnedTabId
    ].filterOffset;
  }
  if (this.filterState.tabs[lastVisibleUnpinnedTabId]) {
    lastVisibleUnpinnedTabFilterOffset = this.filterState.tabs[
      lastVisibleUnpinnedTabId
    ].filterOffset;
  }

  let lastPinnedTab = null;
  let lastUnpinnedTab = null;

  if (lastPinnedTabIndex !== null) {
    lastPinnedTab = this.tabs[lastPinnedTabIndex];
    // console.log(lastPinnedTab);
  }
  if (lastUnpinnedTabIndex !== null) {
    lastUnpinnedTab = this.tabs[lastUnpinnedTabIndex];
  }

  // const numChecked = this.menu.checkedVisibleTabs.length;
  // let numCheckedAbove = 0;
  // let numUncheckedAbove = 0;
  let numCheckedPinnedAbove = 0;
  let numUncheckedPinnedAbove = 0;
  let numCheckedUnpinnedAbove = 0;
  let numUncheckedUnpinnedAbove = 0;

  disableHeaderControls.call(this);

  // reset variables
  resetTabCSSVariables(visibleTabs);

  // get info about tabs
  this.moveState = {
    firstHiddenTabIndex: null,
    lastTabIndex,
    tabRowHeight,
    checkedVisibleTabs,
    destinaton,
    onMoveEnd: function () {
      // reset style variables and move tabs in the DOM
      this.visibleTabIds.forEach((id, index) => {
        const tab = visibleTabs[index];
        let newOffset = 0;
        if (this.filterState.tabs[id]) {
          newOffset = this.filterState.tabs[id].filterOffset;
        }

        window.requestAnimationFrame(() => {
          tab.classList.remove("tab--moving");
          tab.classList.remove("tab--peach");
          tab.style.setProperty("--filter-offset", newOffset + "px");
          tab.style.setProperty("--moved-offset", 0 + "px");
        });
      });

      this.filterState.firstHiddenTabIndex = this.moveState.firstHiddenTabIndex;
      const options = {
        pinnedTabsToMove: checkedVisiblePinnedTabs,
        unpinnedTabsToMove: checkedVisibleUnpinnedTabs
      };
      this.moveState.moveTabsInTheDOM(options);

      // enable menu buttons and filter
      window.requestAnimationFrame(() => {
        // this.moveState.moveTabsInTheDOM(options);
        const event = new Event("orderoftabschange", { bubbles: true });
        this.tabList.dispatchEvent(event);
      });
    }.bind(this),
    moveTabsInTheDOM: function (options) {
      const { pinnedTabsToMove, unpinnedTabsToMove } = options;
      const fragmentOfPinned = document.createDocumentFragment();
      const fragmentOfUnpinned = document.createDocumentFragment();
      // pinnedTabsToMove.forEach(tab => {
      //   fragmentOfPinned.appendChild(tab);
      // });
      // unpinnedTabsToMove.forEach(tab => {
      //   fragmentOfUnpinned.appendChild(tab);
      // });

      let tabToInsertPinnedBefore = null;
      let tabToInsertUnpinnedBefore = null;
      if (this.moveState.destinaton === "bottom") {
        if (pinnedTabsToMove.length > 0) {
          // tabToInsertPinnedBefore = lastPinnedTab.nextSibling;
          // const firstUnpinnedVisibleTab = this.tabs[
          //   this.menu.firstUncheckedUnpinnedIndex
          // ];
          tabToInsertPinnedBefore = this.tabs[tabIndexToInsertPinnedBefore];
        }
        if (unpinnedTabsToMove.length > 0) {
          // lastUnpinnedTab
          tabToInsertUnpinnedBefore = lastUnpinnedTab.nextSibling;
          // tabToInsertUnpinnedBefore = this.tabList.lastChild.nextSibling;
          // console.log(lastUnpinnedTab);
        }
      } else {
        if (pinnedTabsToMove.length > 0) {
          tabToInsertPinnedBefore = this.tabList.firstChild;
        }
        if (unpinnedTabsToMove.length > 0) {
          const firstUnpinnedTab = this.tabs[this.menu.firstUnpinnedTabIndex];
          tabToInsertUnpinnedBefore = firstUnpinnedTab;
        }
      }

      pinnedTabsToMove.forEach(tab => {
        fragmentOfPinned.appendChild(tab);
      });
      unpinnedTabsToMove.forEach(tab => {
        fragmentOfUnpinned.appendChild(tab);
      });

      window.requestAnimationFrame(() => {
        if (lastPinnedTabIndex) {
          this.tabList.insertBefore(fragmentOfPinned, tabToInsertPinnedBefore);
        }
        if (lastUnpinnedTabIndex) {
          this.tabList.insertBefore(
            fragmentOfUnpinned,
            tabToInsertUnpinnedBefore
          );
        }
        this.tabs = [...this.tabList.children];
      });
    }.bind(this)
  };

  const reorderedVisibleTabIds = [];
  const reorderedTabObjects = [];
  let animateMovement = true;
  let maxDistanceToMove = 0;

  this.orderedTabObjects.forEach((obj, index) => {
    const id = obj.id;

    if (destinaton === "bottom") {
      // if tab is visible
      if (this.tabIndices[id][1] !== null) {
        // if tab is NOT checked
        const tab = this.tabs[index];
        if (obj.isChecked === false) {
          let numCheckedAbove;
          let numUncheckedAbove;
          let numUnchecked;
          if (obj.isPinned) {
            numUnchecked = numUncheckedPinned;
            numCheckedAbove = numCheckedPinnedAbove;
            numUncheckedAbove = numUncheckedPinnedAbove;
            numUncheckedPinnedAbove += 1;
          } else {
            numUnchecked = numUncheckedUnpinned;
            numCheckedAbove = numCheckedUnpinnedAbove;
            numUncheckedAbove = numUncheckedUnpinnedAbove;
            numUncheckedUnpinnedAbove += 1;
            if (tabIndexToInsertPinnedBefore === null) {
              tabIndexToInsertPinnedBefore = index;
            }
          }

          if (numCheckedAbove > 0) {
            this.tabIndices[id] = [
              this.tabIndices[id][0] - numCheckedAbove,
              this.tabIndices[id][1] - numCheckedAbove
            ];
            const distanceToMove = numCheckedAbove * tabRowHeight * -1;
            window.requestAnimationFrame(() => {
              tab.style.setProperty("--moved-offset", distanceToMove + "px");
              tab.classList.add("tab--peach");
            });

            const numUncheckedBelow = numUnchecked - numUncheckedAbove - 1;
            if (numUncheckedBelow === 0) {
              maxDistanceToMove =
                Math.abs(distanceToMove) > maxDistanceToMove
                  ? Math.abs(distanceToMove)
                  : maxDistanceToMove;
            }
          }
        } else {
          // if tab IS checked
          let numCheckedAbove;
          let numUncheckedAbove;
          let numChecked;
          let numUnchecked;
          let movedTabFilterOffset = 0;
          let lastTabIndex;
          if (obj.isPinned) {
            numChecked = numCheckedPinned;
            numUnchecked = numUncheckedPinned;
            numCheckedAbove = numCheckedPinnedAbove;
            numUncheckedAbove = numUncheckedPinnedAbove;
            movedTabFilterOffset = lastVisiblePinnedTabFilterOffset;
            numCheckedPinnedAbove += 1;
            lastTabIndex = lastPinnedTabIndex;
          } else {
            numChecked = numCheckedUnpinned;
            numUnchecked = numUncheckedUnpinned;
            numCheckedAbove = numCheckedUnpinnedAbove;
            numUncheckedAbove = numUncheckedUnpinnedAbove;
            movedTabFilterOffset = lastVisibleUnpinnedTabFilterOffset;
            numCheckedUnpinnedAbove += 1;
            lastTabIndex = lastUnpinnedTabIndex;
          }

          const numCheckedBelow = numChecked - numCheckedAbove - 1;
          const numUncheckedBelow = numUnchecked - numUncheckedAbove;
          const distanceToMove = numUncheckedBelow * tabRowHeight;

          if (numCheckedAbove === 0) {
            if (numUncheckedBelow > 0) {
              maxDistanceToMove =
                distanceToMove > maxDistanceToMove
                  ? distanceToMove
                  : maxDistanceToMove;
              tab.onanimationend = e => {
                if (e.animationName === "moving") {
                  tab.onanimationend = null;
                  this.moveState.onMoveEnd.call(this);
                }
              };
            } else animateMovement = false;
          }

          this.tabIndices[id] = [
            lastTabIndex - numCheckedBelow,
            this.tabIndices[id][1] + numUncheckedBelow
          ];
          if (this.filterState.tabs[id]) {
            this.filterState.tabs[id].filterOffset = movedTabFilterOffset;
          }
          if (numUncheckedBelow > 0) {
            window.requestAnimationFrame(() => {
              tab.style.setProperty("--moved-offset", distanceToMove + "px");
              tab.style.setProperty("--scale", 0.96);
              tab.style.setProperty("--opacity", 0.4);
              tab.classList.add("tab--moving");
            });
          }

          // numCheckedAbove += 1;
        }
        reorderedVisibleTabIds[this.tabIndices[id][1]] = id;
        // reorderedVisibleTabIds[reorderedVisibleTabIds.length] = id;
      } else {
        // if tab is hidden
        let numCheckedAbove;
        if (obj.isPinned) {
          tabIndexToInsertPinnedBefore = index;
          numCheckedAbove = numCheckedPinnedAbove;
        } else {
          numCheckedAbove = numCheckedUnpinnedAbove;
        }
        this.tabIndices[id][0] -= numCheckedAbove;
        this.filterState.lastHiddenTabIndex = this.tabIndices[id][0];
        if (this.moveState.firstHiddenTabIndex === null) {
          this.moveState.firstHiddenTabIndex = this.tabIndices[id][0];
        }
      }
    } else {
      // if tab is visible
      if (this.tabIndices[id][1] !== null) {
        // if tab is NOT checked
        if (obj.isChecked === false) {
          const numCheckedBelow = numChecked - numCheckedAbove;
          if (numCheckedBelow > 0) {
            this.tabIndices[id] = [
              this.tabIndices[id][0] + numCheckedBelow,
              this.tabIndices[id][1] + numCheckedBelow
            ];
            const distanceToMove = numCheckedBelow * tabRowHeight;
            const tab = this.tabs[index];
            window.requestAnimationFrame(() => {
              tab.style.setProperty("--moved-offset", distanceToMove + "px");
              tab.classList.add("tab--peach");
            });

            maxDistanceToMove =
              distanceToMove > maxDistanceToMove
                ? distanceToMove
                : maxDistanceToMove;
          }

          numUncheckedAbove += 1;
        } else {
          // if tab IS checked
          const numCheckedBelow = numChecked - numCheckedAbove - 1;
          const distanceToMove = numUncheckedAbove * tabRowHeight * -1;
          const tab = this.tabs[index];

          if (numCheckedBelow === 0) {
            if (numUncheckedAbove > 0) {
              maxDistanceToMove =
                Math.abs(distanceToMove) > maxDistanceToMove
                  ? Math.abs(distanceToMove)
                  : maxDistanceToMove;
              tab.onanimationend = e => {
                if (e.animationName === "moving") {
                  tab.onanimationend = null;
                  this.moveState.onMoveEnd.call(this);
                }
              };
            } else animateMovement = false;
          }

          this.tabIndices[id] = [numCheckedAbove, numCheckedAbove];
          if (this.filterState.tabs[id]) {
            this.filterState.tabs[id].filterOffset = 0;
          }

          if (numUncheckedAbove > 0) {
            window.requestAnimationFrame(() => {
              tab.style.setProperty("--moved-offset", distanceToMove + "px");
              tab.style.setProperty("--scale", 0.96);
              tab.style.setProperty("--opacity", 0.4);
              tab.classList.add("tab--moving");
            });
          }

          numCheckedAbove += 1;
        }
        reorderedVisibleTabIds[this.tabIndices[id][1]] = id;
      } else {
        // if tab is hidden
        const numCheckedBelow = numChecked - numCheckedAbove;
        this.tabIndices[id][0] += numCheckedBelow;
        this.filterState.lastHiddenTabIndex = this.tabIndices[id][0];
        if (this.moveState.firstHiddenTabIndex === null) {
          this.moveState.firstHiddenTabIndex = this.tabIndices[id][0];
        }
      }
    }
    reorderedTabObjects[this.tabIndices[id][0]] = obj;
    // reorderedTabObjects[reorderedTabObjects.length] = obj;
  });

  const animationDuration = Math.min(maxDistanceToMove * 2.174, 220);
  document.documentElement.style.setProperty(
    "--animation-duration",
    animationDuration + "ms"
  );

  // console.log(`animationDuration: ${animationDuration}`);
  // move browser tabs
  // const movedTabsBrowserIds = this.moveState.checkedVisibleTabs.map(
  //   tab => +tab.id.split("-")[1]
  // );

  const moveBrowserTabsToIndex = async function (tabsToMove, index) {
    try {
      await chrome.tabs.move(movedTabsBrowserIds, {
        index
      });
    } catch (error) {
      if (
        error ==
        "Error: Tabs cannot be edited right now (user may be dragging a tab)."
      ) {
        setTimeout(() => moveBrowserTabsToIndex(index), 50);
      } else {
        console.error(error);
      }
    }
  };

  const indexToMoveTo = destinaton === "bottom" ? lastTabIndex : 0;
  // moveBrowserTabsToIndex(movedTabsBrowserIds, indexToMoveTo);
  this.orderedTabObjects = reorderedTabObjects;
  this.visibleTabIds = reorderedVisibleTabIds;
  // console.log(this.orderedTabObjects.filter(obj => !obj.isPinned));
  if (maxDistanceToMove === 0) {
    this.moveState.onMoveEnd.call(this);
  }
}

export { moveTabs };
