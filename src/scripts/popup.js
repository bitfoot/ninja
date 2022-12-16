const util = require("./modules/util");
const renderTabComponents = require("./modules/renderTabComponents");
const addTab = require("./modules/addTab");
const deleteTabs = require("./modules/deleteTabs");
const initializeTabDrag = require("./modules/initializeTabDrag");
const moveTabs = require("./modules/moveTabs");
const initializeScrollbarDrag = require("./modules/initializeScrollbarDrag");
const filter = require("./modules/filter");
const onScroll = require("./modules/onScroll");
const adjustMenu = require("./modules/adjustMenu");

const state = {
  tabList: document.getElementById("tab-list"),
  orderedTabObjects: [],
  tabs: [],
  visibleTabIds: [],
  hiddenTabIds: [],
  tabIndices: {},
  tabIdsByURL: {
    // "https://www.google.com" : ["tab-1", "tab-2", "tab-3"]
  },
  addTab,
  deleteTabs,
  // have to keep order of all tab Ids so that they can be moved on UI (before actual browser tabs are moved)
  dragState: null,
  dragTimer: null,
  menuData: null,
  // maxScrollbarThumbOffset: 0,
  // totalFilteredOutTabs: 0,
  // lastFilteredOutTabs: 0,
  // filteredInTabs: 0,
  // filterIsActive: false,
  selectedTabs: [],
  filterState: {
    filterIsActive: false,
    clearFilterBtn: document.getElementById("remove-filter-text-btn"),
    input: document.getElementById("filter-input"),
    tabs: {},
    numOfFilteredTabs: null,
    firstHiddenTabIndex: null,
    lastHiddenTabIndex: null,
    firstVisibleTabIndex: null,
    lastVisibleTabIndex: null,
    firstNewlyFilteredOutTabIndex: null,
    lastNewlyFilteredOutTabIndex: null,
    firstNewlyFilteredInTabIndex: null,
    lastNewlyFilteredInTabIndex: null,
    lastMatchedTabIndex: null,
    scrollingUp: false
  },
  scrollState: {
    maxScrollbarThumbOffset: null,
    containerToContentRatio: null,
    headerHeight: 52,
    maxContainerHeight: 506,
    container: document.getElementById("tab-list-container"),
    scrollbarTrack: document.getElementById("scrollbar-track"),
    scrollbarThumb: document.getElementById("scrollbar-thumb"),
    thumbOffset: 0,
    scrollTop: 0,
    maxScrollTop: 0,
    tabListOffset: 0
  }
};

// render tabs
chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, function (
  tabs
) {
  tabs.forEach(tab => {
    state.addTab(tab);
  });
  renderTabComponents.call(state);
  util.adjustScrollbar.call(state);
  adjustMenu.call(state);
});

// document.addEventListener("pointermove", e => {
//   console.log(e.clientX, e.clientY);
// });

document.addEventListener("click", e => {
  if (e.target.id === "close-duplicates-btn") {
    // const tabIdsToDelete = [];
    const idsByURL = state.visibleTabIds.reduce((a, id) => {
      const browserIndex = state.tabIndices[id][0];
      const URL = state.orderedTabObjects[browserIndex].url;
      if (!a[URL]) {
        a[URL] = [id];
      } else {
        a[URL].push(id);
      }
      return a;
    }, {});

    const unluckyTabIds = Object.values(idsByURL).reduce((a, idsArr) => {
      if (idsArr.length > 1) {
        let luckyTabInfo = null;
        idsArr.forEach(id => {
          const index = state.tabIndices[id][0];
          const tabObj = {
            id,
            isActive: state.orderedTabObjects[index].isActive,
            isPinned: state.orderedTabObjects[index].isPinned
          };
          if (luckyTabInfo === null) {
            luckyTabInfo = tabObj;
          } else {
            if (luckyTabInfo.isActive) {
              a[id] = true;
            } else if (tabObj.isActive) {
              a[luckyTabInfo.id] = true;
              luckyTabInfo = tabObj;
            } else if (
              Number(luckyTabInfo.isPinned) >= Number(tabObj.isPinned)
            ) {
              a[id] = true;
            } else {
              a[luckyTabInfo.id] = true;
              luckyTabInfo = tabObj;
            }
          }
        });
      }
      return a;
    }, {});
    const tabIdsToDelete = state.visibleTabIds.filter(id => unluckyTabIds[id]);
    // console.log(tabIdsToDelete);
    deleteTabs.call(state, tabIdsToDelete);
  } else if (e.target.classList.contains("tab__delete-button")) {
    const tab = e.target.parentElement;
    if (!tab.classList.contains("tab--deleted")) {
      deleteTabs.call(state, [tab.id]);
    }
  } else if (e.target.classList.contains("tab__tab-button")) {
    // const tabButton = e.target;
    // if (tabButton.parentElement.classList.contains("tab--held-down")) {
    //   tabButton.parentElement.classList.remove("tab--held-down");
    //   const tabId = e.target.parentElement.id;
    //   const browserTabId = parseInt(tabId.split("-")[1]);
    //   chrome.tabs.get(browserTabId, function (tab) {
    //     chrome.tabs.highlight({ tabs: tab.index }, function () { });
    //   });
    // }
  } else if (e.target.id === "select-deselect-all-btn") {
    const allVisibleTabsAreChecked = state.visibleTabIds.every(id => {
      const tabIndex = state.tabIndices[id][0];
      if (state.orderedTabObjects[tabIndex].isChecked) {
        return true;
      }
    });

    const shouldBeChecked = allVisibleTabsAreChecked ? false : true;
    state.visibleTabIds.forEach(id => {
      const tabIndex = state.tabIndices[id][0];
      // const checkbox = state.tabs[tabIndex].children[1].firstChild;
      const checkbox = state.tabs[tabIndex].querySelector(".tab__checkbox");
      state.orderedTabObjects[tabIndex].isChecked = shouldBeChecked;
      checkbox.checked = shouldBeChecked;
    });
    adjustMenu.call(state);
  } else if (e.target.id === "close-selected-btn") {
    const tabIds = state.visibleTabIds.filter(id => {
      const obj = state.orderedTabObjects[state.tabIndices[id][0]];
      if (obj.isChecked) {
        return true;
      }
    });
    deleteTabs.call(state, tabIds);
  } else if (e.target.id === "move-to-top-btn") {
    moveTabs.call(state, "top");
    adjustMenu.call(state);
  } else if (e.target.id === "move-to-bottom-btn") {
    moveTabs.call(state, "bottom");
    adjustMenu.call(state);
  } else if (e.target.id === "remove-filter-text-btn") {
    const filterInput = state.filterState.input;
    filterInput.value = "";
    filter.call(state);
  }
});

document.addEventListener(`input`, e => {
  if (e.target.classList.contains("tab__checkbox")) {
    const label = e.target.parentElement;
    const tabId = label.parentElement.id;
    const tabIndex = state.tabIndices[tabId][0];
    if (e.target.checked) {
      label.classList.add(`tab__checkbox-label--checked`);
      state.orderedTabObjects[tabIndex].isChecked = true;
    } else {
      label.classList.remove(`tab__checkbox-label--checked`);
      state.orderedTabObjects[tabIndex].isChecked = false;
    }
    adjustMenu.call(state);
  } else if (e.target.id === "filter-input") {
    filter.call(state);
  }
});

state.scrollState.container.addEventListener("scroll", onScroll.bind(state));

document.addEventListener("pointerdown", e => {
  // if the left mouse button was clicked, we don't need to do anything
  if (e.pointerType === "mouse" && e.buttons !== 1) {
    return;
  }
  if (e.target.classList.contains("tab__tab-button")) {
    const tabButton = e.target;
    const parent = tabButton.parentElement;
    const pointerId = e.pointerId;
    tabButton.setPointerCapture(pointerId);
    const bounds = parent.getBoundingClientRect();
    parent.classList.add("tab--held-down");

    requestAnimationFrame(() => {
      parent.style.setProperty("--x-pos", e.clientX - bounds.left + "px");
      parent.style.setProperty("--y-pos", e.clientY - bounds.top + "px");
    });

    state.dragTimer = setTimeout(initializeTabDrag.bind(state, e), 300);
    tabButton.onpointerup = () => {
      clearTimeout(state.dragTimer);
      tabButton.releasePointerCapture(pointerId);
      if (state.dragState === null) {
        tabButton.parentElement.classList.remove("tab--held-down");
        const tabId = e.target.parentElement.id;
        const browserTabId = parseInt(tabId.split("-")[1]);
        chrome.tabs.get(browserTabId, function (tab) {
          chrome.tabs.highlight({ tabs: tab.index }, function () { });
        });
      }
    };
  } else if (e.target.id === "scrollbar-thumb") {
    initializeScrollbarDrag.call(state, e);
  } else if (e.target.id === "scrollbar-track") {
    const pointerPos = e.pageY;
    const posOnTrack = pointerPos - state.scrollState.headerHeight;
    const trackRatio = posOnTrack / state.scrollState.scrollbarTrackSpace;
    const scrollDistance = state.scrollState.maxScrollTop * trackRatio;
    state.scrollState.container.scroll({
      top: scrollDistance,
      left: 0,
      behavior: "smooth"
    });
  }
});

document.addEventListener(`keydown`, e => {
  if (e.code !== "Space" && e.code !== "Enter") return;
  if (
    e.target.classList.contains("tab__tab-button") &&
    state.dragState === null
  ) {
    const tabButton = e.target;
    tabButton.parentElement.classList.add("tab--held-down");
    state.dragTimer = setTimeout(initializeTabDrag.bind(state, e), 300);
    tabButton.onkeyup = () => {
      clearTimeout(state.dragTimer);
      if (state.dragState === null) {
        tabButton.parentElement.classList.remove("tab--held-down");
        const tabId = e.target.parentElement.id;
        const browserTabId = parseInt(tabId.split("-")[1]);
        chrome.tabs.get(browserTabId, function (tab) {
          chrome.tabs.highlight({ tabs: tab.index }, function () { });
        });
      }
    };
  }
});

document.addEventListener("pointermove", e => {
  if (e.target.classList.contains("tab__tab-button")) {
    const tabButton = e.target;
    const parent = tabButton.parentElement;
    const bounds = parent.getBoundingClientRect();
    requestAnimationFrame(() => {
      parent.style.setProperty("--x-pos", e.clientX - bounds.left + "px");
      parent.style.setProperty("--y-pos", e.clientY - bounds.top + "px");
    });
  } else if (e.target.id === "filter-input") {
    const filter = e.target.parentElement;
    const bounds = filter.getBoundingClientRect();
    requestAnimationFrame(() => {
      filter.style.setProperty("--x-pos", e.clientX - bounds.left + "px");
      filter.style.setProperty("--y-pos", e.clientY - bounds.top + "px");
    });
  }
});

document.addEventListener("contextmenu", e => {
  if (e.target.classList.contains("tab__tab-button")) {
    e.target.parentElement.classList.remove("tab--held-down");
  }
});

// document.addEventListener("keyup", e => {
//   if (e.target.id == "filter-input") {
//     if (e.key !== "Tab") {
//       filter.call(state);
//     }
//   }
//   // console.log(e.key);
// });
