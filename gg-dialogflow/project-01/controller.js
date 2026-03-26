const { WebhookClient } = require("dialogflow-fulfillment");

const handleWebhook = (request, response) => {
  console.log("/project-01/webhook is called!");
  const agent = new WebhookClient({ request, response });
  // Intent Function
  let result = "ขอโทษครับ ผมไม่เข้าใจคำถาม";
  function welcome(agent) {
    result = "สวัสดีครับ มีอะไรให้ช่วยไหมครับ";
    agent.add(result);
  }
  function fallback(agent) {
    agent.add(result);
  }
  function calcBMIfunc(agent) {
    let weight = parseFloat(agent.parameters.weight || 0);
    let height = parseFloat(agent.parameters.height || 0) / 100;
    if (weight > 0 && height > 0) {
      const bmi = (weight / (height * height)).toFixed(2);
      result = `BMI ของคุณคือ ${bmi}\n`;
      if (bmi < 18.5) {
        result = result + `คุณผอมเกินไปครับ`;
      } else if (bmi < 23) {
        result = result + `คุณสมส่วนแล้วครับ`;
      } else if (bmi < 25) {
        result = result + `คุณเริ่มจะอ้วนแล้วครับ`;
      } else if (bmi < 30) {
        result = result + `คุณอ้วนแล้วล่ะครับ`;
      } else {
        result = result + `คุณอ้วนเกินไปครับ`;
      }
    }
    agent.add(result);
  }
  // Intent Mapping
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Body Mass Index - custom - yes', calcBMIfunc);
  agent.handleRequest(intentMap);
};

module.exports = { handleWebhook };