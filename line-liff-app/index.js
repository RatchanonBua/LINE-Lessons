// Fix cache on Android
const originalSDK = window.fetch;
window.fetch = (url, options) => {
  const urlStr = url?.toString() || "";
  if (urlStr.startsWith("https://liffsdk.line-scdn.net/xlt/") && urlStr.endsWith(".json")) {
    const separator = urlStr.includes("?") ? "&" : "?";
    url = `${urlStr}${separator}cache=${new Date().getTime()}`;
  }
  return originalSDK(url, options);
}

// Body element
const body = document.getElementById("body");
// Button elements
const btnSend = document.getElementById("btnSend");
const btnClose = document.getElementById("btnClose");
const btnShare = document.getElementById("btnShare");
const btnLogIn = document.getElementById("btnLogIn");
const btnLogOut = document.getElementById("btnLogOut");
const btnScanCode = document.getElementById("btnScanCode");
const btnOpenWindow = document.getElementById("btnOpenWindow");
// Profile elements
const email = document.getElementById("email");
const userId = document.getElementById("userId");
const pictureUrl = document.getElementById("pictureUrl");
const displayName = document.getElementById("displayName");
const statusMessage = document.getElementById("statusMessage");
// QR elements
const code = document.getElementById("code");
// Friendship element
const friendShip = document.getElementById("friendShip");

// main
async function main() {
  try {
    // Initialize LIFF app
    await liff.init({ liffId: "2006643508-qO3hsXWz" });
    // Try a LIFF function
    switch (liff.getOS()) {
      case "android":
        body.style.backgroundColor = "#d1f5d3";
        break;
      case "ios":
        body.style.backgroundColor = "#eeeeee";
        break;
      case "web":
        body.style.backgroundColor = "#195aea";
        break;
    }
    // isInClient
    if (!liff.isInClient()) {
      if (liff.isLoggedIn()) {
        btnLogOut.style.display = "block";
        btnShare.style.display = "block";
        btnScanCode.style.display = "block";
        getUserProfile();
        getFriendship();
      } else {
        btnLogIn.style.display = "block";
      }
    } else {
      btnSend.style.display = "block";
      btnShare.style.display = "block";
      btnScanCode.style.display = "block";
      getUserProfile();
      getFriendship();
    }
    btnOpenWindow.style.display = "block";
  } catch (error) {
    console.error("LIFF failed:\n", error);
  }
}
main();

// getUserProfile
async function getUserProfile() {
  const profile = await liff.getProfile();
  console.log(profile);
  pictureUrl.src = profile.pictureUrl;
  userId.innerHTML = "<b>userId:</b> " + profile.userId;
  statusMessage.innerHTML = "<b>statusMessage:</b> " + profile.statusMessage;
  displayName.innerHTML = "<b>displayName:</b> " + profile.displayName;
}

// sendMessages
async function sendMessages() {
  if (liff.getContext().type !== "none" && liff.getContext().type !== "external") {
    await liff.sendMessages([
      {
        "type": "text",
        "text": "ข้อความนี้ถูกส่งจากฟังก์ชัน liff.sendMessages()",
      }
    ]);
    liff.closeWindow();
  }
}

// shareTargetPicker
async function shareTargetPicker() {
  await liff.shareTargetPicker([
    {
      type: "image",
      originalContentUrl: "https://d.line-scdn.net/stf/line-lp/2016_en_02.jpg",
      previewImageUrl: "https://d.line-scdn.net/stf/line-lp/2016_en_02.jpg",
    }
  ]);
}

// scanCode
async function scanCode() {
  const result = await liff.scanCodeV2();
  code.innerHTML = "<b>Code: </b>" + result.value;
}

// getFriendship
async function getFriendship() {
  let message = "Hooray! You and our chatbot are friend.";
  const friend = await liff.getFriendship();
  if (!friend.friendFlag) {
    message = "<a href=\"https://line.me/R/ti/p/@499axhqo\">Follow our chatbot here!</a>";
  }
  friendShip.innerHTML = message;
}

// มีปัญหาที่ liff.login() ไม่สามารถทำใน external ได้
btnLogIn.onclick = () => {
  console.log(liff.getContext());
  liff.login();
};
btnLogOut.onclick = () => {
  liff.logout();
  window.location.reload();
};
btnSend.onclick = () => {
  sendMessages();
};
btnShare.onclick = () => {
  shareTargetPicker();
};
btnScanCode.onclick = () => {
  scanCode();
};
btnOpenWindow.onclick = () => {
  liff.openWindow({ url: window.location.href, external: true });
};