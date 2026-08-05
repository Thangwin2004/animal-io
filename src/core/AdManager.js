export class AdManager {
  constructor() {
    this.retryCount = 0;
  }

  showInterstitial(onComplete) {
    this.retryCount++;
    if (this.retryCount >= 3) {
      this.retryCount = 0;
      console.log("Showing Interstitial Ad...");
      // Simulate UI blocking ad
      const adDiv = document.createElement('div');
      adDiv.style.position = 'fixed';
      adDiv.style.top = '0'; adDiv.style.left = '0';
      adDiv.style.width = '100vw'; adDiv.style.height = '100vh';
      adDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
      adDiv.style.color = 'white';
      adDiv.style.display = 'flex';
      adDiv.style.alignItems = 'center';
      adDiv.style.justifyContent = 'center';
      adDiv.style.zIndex = '9999';
      adDiv.innerHTML = '<h1>Đang phát Quảng Cáo (Interstitial)...</h1>';
      document.body.appendChild(adDiv);
      
      setTimeout(() => {
        document.body.removeChild(adDiv);
        console.log("Interstitial Ad Finished.");
        if(onComplete) onComplete();
      }, 2000);
    } else {
      if(onComplete) onComplete();
    }
  }

  showRewardAd(onSuccess, onCancel) {
    console.log("Showing Reward Ad...");
    const adDiv = document.createElement('div');
    adDiv.style.position = 'fixed';
    adDiv.style.top = '0'; adDiv.style.left = '0';
    adDiv.style.width = '100vw'; adDiv.style.height = '100vh';
    adDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    adDiv.style.color = 'white';
    adDiv.style.display = 'flex';
    adDiv.style.flexDirection = 'column';
    adDiv.style.alignItems = 'center';
    adDiv.style.justifyContent = 'center';
    adDiv.style.zIndex = '9999';
    adDiv.innerHTML = `
      <h1>Quảng Cáo Nhận Thưởng</h1>
      <p>Xem hết để nhận thưởng nhé!</p>
      <div style="margin-top:20px;">
        <button id="btnReward" style="padding:10px 20px; font-size:18px; margin-right:10px; cursor:pointer;">Xem xong</button>
        <button id="btnCancel" style="padding:10px 20px; font-size:18px; cursor:pointer;">Bỏ qua</button>
      </div>
    `;
    document.body.appendChild(adDiv);

    document.getElementById('btnReward').onclick = () => {
      document.body.removeChild(adDiv);
      if(onSuccess) onSuccess();
    };
    document.getElementById('btnCancel').onclick = () => {
      document.body.removeChild(adDiv);
      if(onCancel) onCancel();
    };
  }
}
