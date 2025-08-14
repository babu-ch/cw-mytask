// ==UserScript==
// @name         task(message ver)
// @namespace    http://tampermonkey.net/
// @version      2025-06-08
// @description  タスク追加簡略化script
// @author       You
// @match        https://www.chatwork.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatwork.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

// localstorage key
const CW_MYCHAT_ID_KEY = 'mychatId'
const CW_MYCHAT_ID = getId()
const CW_URL = 'https://www.chatwork.com/';

(function () {
  'use strict';

  checkAndRun(document);

  // DOM変化を監視
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const added of m.addedNodes) {
        if (added.nodeType === 1) { // ELEMENT_NODE
          checkAndRun(added);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

function getId() {
  let myId = GM_getValue(CW_MYCHAT_ID_KEY, null);

  if (!myId) {
    myId = prompt('taskを投稿するチャットのID(#!rid1234の1234の部分)');
    if (myId) {
      GM_setValue(CW_MYCHAT_ID_KEY, myId.match(/\d+/)?.[0]);
      alert('保存しました！');
    } else {
      alert('IDが設定されていません。スクリプトは動作しません。');
      return ''
    }
  }
  return myId;
}


// すでにある要素にも対応
function checkAndRun(node) {
  const selector = '#_timeLine > div > div [id^=_messageId] .messageActionNav';
  const targets = node.querySelectorAll?.(selector) ?? [];
  targets.forEach(el => {
    if (!el.dataset._tmObserved) {
      el.dataset._tmObserved = '1';
      // ここに対象要素への処理
      onMessageAreaShown(el)
    }
  });
}

function onMessageAreaShown(ul) {
  const lis = ul.querySelectorAll(':scope > li')
  const taskLi = Array.from(lis).find(li =>
    li.textContent.trim() === 'タスク'
  );
  if (!taskLi) return

  // copy task button
  const cloned = taskLi.cloneNode(true)
  const label = cloned.querySelector('.actionLabel');
  if (label) {
    label.textContent = 'my';
  }
  ul.insertBefore(cloned, taskLi.nextElementSibling)

  cloned.addEventListener('click', () => onClick(ul.closest('._message')))
}

function getPostChatUrl() {
  return `${CW_URL}#!rid${CW_MYCHAT_ID}`
}

async function onClick(message) {
  const url = getUrl(message)
  location.href = getPostChatUrl()
  await new Promise(resolve => setTimeout(resolve, 200))
  const area = document.querySelector('#_taskAddArea')
  area?.click()

  await new Promise(resolve => setTimeout(resolve, 200))
  const input = document.querySelector('#_taskInputActive textarea')

  const text = [...message.querySelectorAll('pre span')].map(e => e.innerText).join("\n")
  await setValue(input, `${url}\n${text}`)

  const addTaskButton = document.querySelector(
    'button[data-testid="room-sub-column_room-task_add-button"]'
  );
  addTaskButton?.click()
}

// react set
async function setValue(input, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype, 'value'
  ).set;

  nativeSetter.call(input, value);
  input.value = value
  if (input._valueTracker) {
    input._valueTracker.setValue('hello');

  }
  await new Promise(resolve => setTimeout(resolve, 200))
  input.dispatchEvent(new Event('input', {bubbles: true}));
}


function getUrl(message) {
  return `${CW_URL}#!rid${message.dataset.rid}-${message.dataset.mid}`
}


