// ==UserScript==
// @name         task3
// @namespace    http://tampermonkey.net/
// @version      2025-06-08
// @description  タスク追加簡略化script(そのチャットにタスク追加するver)
// @author       You
// @match        https://www.chatwork.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatwork.com
// ==/UserScript==

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

function getPostChatUrl(chatId) {
  return `${CW_URL}#!rid${chatId}`
}

async function onClick(message) {
  const url = getUrl(message)
  location.href = getPostChatUrl(message.dataset.rid)
  await new Promise(resolve => setTimeout(resolve, 200))
  const area = document.querySelector('#_taskAddArea')
  area?.click()

  await new Promise(resolve => setTimeout(resolve, 200))
  const input = document.querySelector('#_taskInputActive textarea')

  const text = [...message.querySelectorAll('pre span')].map(e => e.innerText).join("\n")
  await setValue(input, `${url}\n${text}`)

  // 担当者を設定
  const event = new MouseEvent('mouseover', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  // どれかが担当者のボタンなので乱射する
  [...document.querySelectorAll('#_taskInputActive button')].forEach(e => e.dispatchEvent(event))
  await new Promise(resolve => setTimeout(resolve, 200))
  // 1つ目が自分のはず
  document.querySelector('.floatingComponentContainer .userIconImage').click()

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


