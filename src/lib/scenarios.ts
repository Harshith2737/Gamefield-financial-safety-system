export type MessageType = 'sms' | 'call' | 'whatsapp' | 'email' | 'app_screen' | 'popup'

export interface ScenarioChoice {
  id: string
  text: string
  isSafe: boolean
  feedbackTitle: string
  feedbackExplanation: string
  redFlags?: string[]
  xpGained: number
  nextStepId?: string
  isTerminal?: boolean
}

export interface ScenarioStep {
  id: string
  order: number
  messageType: MessageType
  sender: string
  senderHandle?: string
  content: string
  contextNote?: string
  isEntryPoint?: boolean
  choices: ScenarioChoice[]
}

export interface ScenarioData {
  slug: string
  title: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  xpReward: number
  emoji: string
  tips: string[]
  steps: ScenarioStep[]
}

export const SCENARIOS: ScenarioData[] = [
  // ────────────────────────────────────────────────────────────
  // 1. FAKE LOAN OFFER
  // ────────────────────────────────────────────────────────────
  {
    slug: 'fake-loan-offer',
    title: 'Too Good To Be True Loan',
    description: 'You receive an SMS about an instant personal loan with zero documentation. Can you spot the scam?',
    category: 'fake_loan',
    difficulty: 'beginner',
    xpReward: 100,
    emoji: '💸',
    tips: [
      'Real banks never offer loans via SMS with no documentation',
      'Processing fees demanded upfront are a classic red flag',
      'Verify loan offers only through official bank websites or branches',
      'RBI-registered NBFCs never ask for OTPs or PINs',
    ],
    steps: [
      {
        id: 'fl-1',
        order: 1,
        messageType: 'sms',
        sender: 'VM-QUICKLN',
        senderHandle: '+91-9876543210',
        content: 'Congratulations! You are pre-approved for an INSTANT LOAN of ₹2,00,000 at just 0% interest! No documents needed. Click http://quickloan-apply.xyz to claim within 2 hours or offer expires! Call 9988776655 for instant disbursement.',
        contextNote: 'You receive this SMS on a Monday morning.',
        isEntryPoint: true,
        choices: [
          {
            id: 'fl-1-a',
            text: 'Click the link to see the loan offer details',
            isSafe: false,
            feedbackTitle: 'Danger! Phishing Link Detected',
            feedbackExplanation: 'The URL "quickloan-apply.xyz" is NOT a legitimate bank website. Clicking such links can install malware on your phone, steal your banking credentials, or trick you into submitting personal documents to fraudsters.',
            redFlags: ['Unofficial domain (.xyz)', 'Urgency pressure (2 hours)', 'Unsolicited SMS', 'Unknown sender number'],
            xpGained: 0,
            nextStepId: 'fl-2-bad',
          },
          {
            id: 'fl-1-b',
            text: 'Call the number 9988776655 to enquire',
            isSafe: false,
            feedbackTitle: 'Risky! Do Not Call Unknown Numbers',
            feedbackExplanation: 'Calling back numbers in scam SMSes connects you directly to fraudsters. They will use social engineering to extract your Aadhaar, PAN, or banking details. Always call only official bank helpline numbers.',
            redFlags: ['Unknown phone number', 'Not an official bank helpline', 'Social engineering risk'],
            xpGained: 0,
            nextStepId: 'fl-2-bad',
          },
          {
            id: 'fl-1-c',
            text: 'Ignore and report the SMS as spam',
            isSafe: true,
            feedbackTitle: 'Smart Move! You Spotted the Scam',
            feedbackExplanation: 'Legitimate banks send loan offers only through verified TRAI DLT-registered sender IDs (like VM-AXISBK), never from personal numbers. "0% interest" + "no documents" + urgency = classic scam formula. Reporting helps protect others too.',
            redFlags: [],
            xpGained: 30,
            nextStepId: 'fl-2-good',
          },
        ],
      },
      {
        id: 'fl-2-bad',
        order: 2,
        messageType: 'app_screen',
        sender: 'QuickLoan App',
        content: 'Welcome to QuickLoan!\n\nTo process your ₹2,00,000 loan, please pay a one-time processing fee of ₹999 via UPI to quickloan@paytm\n\nThis fee is 100% refundable after loan disbursement.',
        contextNote: 'You are now on a fake loan website asking for money upfront.',
        choices: [
          {
            id: 'fl-2-bad-a',
            text: 'Pay the ₹999 processing fee — it will be refunded',
            isSafe: false,
            feedbackTitle: 'You Lost Money to a Scam',
            feedbackExplanation: 'No legitimate loan provider ever charges an upfront processing fee before disbursement. This is the most common fake loan scam. Once you pay, the "lender" disappears. You will never get the loan OR the refund.',
            redFlags: ['Upfront fee demanded', 'Promise of refund after payment', 'Personal UPI handle not official'],
            xpGained: 0,
            isTerminal: true,
          },
          {
            id: 'fl-2-bad-b',
            text: 'Refuse to pay — this is a scam red flag',
            isSafe: true,
            feedbackTitle: 'Good Recovery! You Avoided Further Loss',
            feedbackExplanation: 'Upfront processing fees are THE definitive sign of a fake loan scam. Real lenders deduct fees from the loan amount, they never ask you to pay first. You correctly identified the trap.',
            redFlags: ['Upfront fee = always a scam'],
            xpGained: 20,
            isTerminal: true,
          },
        ],
      },
      {
        id: 'fl-2-good',
        order: 2,
        messageType: 'sms',
        sender: 'SB-OFFICIAL',
        content: 'You receive another SMS from your actual bank: "Dear Customer, you are eligible for a pre-approved personal loan of ₹1,50,000. Login to our official app or visit branch. Do NOT share OTP with anyone. - State Bank Help: 1800-XXX-XXXX"',
        contextNote: 'Your real bank now sends a verified offer.',
        choices: [
          {
            id: 'fl-2-good-a',
            text: 'Login to the official bank app to check the offer',
            isSafe: true,
            feedbackTitle: 'Perfect! This is How It Should Be Done',
            feedbackExplanation: 'Official bank apps use secure login (biometrics + MPIN). Pre-approved offers visible inside the app are legitimate. Always verify loan offers through official channels only.',
            redFlags: [],
            xpGained: 40,
            isTerminal: true,
          },
          {
            id: 'fl-2-good-b',
            text: 'Call the toll-free number in the SMS to proceed',
            isSafe: true,
            feedbackTitle: 'Good Choice! Toll-Free Helplines Are Safe',
            feedbackExplanation: 'Numbers starting with 1800 are official toll-free helplines. However, always cross-verify by searching the bank name + official helpline on Google before calling.',
            redFlags: [],
            xpGained: 30,
            isTerminal: true,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 2. KYC FRAUD CALL
  // ────────────────────────────────────────────────────────────
  {
    slug: 'kyc-fraud-call',
    title: 'Urgent KYC Update',
    description: 'A caller claims to be from your bank demanding immediate KYC completion, threatening to block your account.',
    category: 'kyc_fraud',
    difficulty: 'beginner',
    xpReward: 100,
    emoji: '📞',
    tips: [
      'Banks NEVER call you asking for OTPs, PINs, or passwords',
      'Real KYC updates are done in-branch or through official apps only',
      'Threats to block your account within hours are pressure tactics',
      'Hang up and call your bank\'s official number to verify',
    ],
    steps: [
      {
        id: 'kyc-1',
        order: 1,
        messageType: 'call',
        sender: 'Unknown: +91-8765432109',
        content: '"Hello, I am calling from HDFC Bank\'s KYC department. Your account will be blocked within 4 hours if you do not complete your KYC update immediately. Please stay on the call and I will guide you. First, please tell me your registered mobile number and the last 4 digits of your Aadhaar."',
        contextNote: 'You receive this call at 2 PM on a weekday.',
        isEntryPoint: true,
        choices: [
          {
            id: 'kyc-1-a',
            text: 'Provide the information — I don\'t want my account blocked',
            isSafe: false,
            feedbackTitle: 'Critical Error! Never Share Personal Info on Cold Calls',
            feedbackExplanation: 'You have now given a fraudster your mobile number and partial Aadhaar. With these, they can attempt SIM swapping, request your full Aadhaar from UIDAI, and ultimately drain your account. Banks NEVER ask for personal info over unsolicited calls.',
            redFlags: ['Unsolicited call', 'Urgency/threat to block account', 'Asking for Aadhaar digits', 'Unknown number claiming to be bank'],
            xpGained: 0,
            nextStepId: 'kyc-2-bad',
          },
          {
            id: 'kyc-1-b',
            text: 'Ask for their employee ID and call back on HDFC\'s official number',
            isSafe: true,
            feedbackTitle: 'Excellent! Verification is Key',
            feedbackExplanation: 'Asking to verify independently is exactly right. Legitimate bank employees will give their ID and encourage you to call back. Fraudsters will refuse or give fake IDs. Always call back using the number on the back of your debit card or the bank\'s official website.',
            redFlags: [],
            xpGained: 35,
            nextStepId: 'kyc-2-good',
          },
          {
            id: 'kyc-1-c',
            text: 'Hang up immediately and block the number',
            isSafe: true,
            feedbackTitle: 'Great Instinct! Hang Up on Suspicious Calls',
            feedbackExplanation: 'Your instinct to hang up was right. No bank penalizes you for not completing KYC on a phone call. KYC updates have a process through official channels. Blocking the number prevents further harassment.',
            redFlags: [],
            xpGained: 30,
            nextStepId: 'kyc-2-good',
          },
        ],
      },
      {
        id: 'kyc-2-bad',
        order: 2,
        messageType: 'call',
        sender: 'Unknown: +91-8765432109',
        content: '"Thank you. Now for verification, I am sending an OTP to your number. Please read it out to me so I can update your KYC on our system."',
        contextNote: 'You receive an OTP from your bank\'s official number.',
        choices: [
          {
            id: 'kyc-2-bad-a',
            text: 'Read out the OTP to complete the KYC',
            isSafe: false,
            feedbackTitle: 'Account Compromised!',
            feedbackExplanation: 'The scammer used your mobile number to trigger a real OTP from your bank — for a PASSWORD RESET or TRANSACTION. Reading it out gives them complete access to your account. NEVER share OTPs with anyone, even someone claiming to be your bank.',
            redFlags: ['OTP requested over call', 'Classic account takeover technique'],
            xpGained: 0,
            isTerminal: true,
          },
          {
            id: 'kyc-2-bad-b',
            text: 'Refuse to share the OTP and hang up',
            isSafe: true,
            feedbackTitle: 'You Stopped the Scam in Time!',
            feedbackExplanation: 'The OTP was triggered by the scammer to take over your account. By refusing to share it, you blocked their access. Call your bank immediately to report the incident and secure your account.',
            redFlags: [],
            xpGained: 25,
            isTerminal: true,
          },
        ],
      },
      {
        id: 'kyc-2-good',
        order: 2,
        messageType: 'app_screen',
        sender: 'HDFC Bank Official App',
        content: 'You open the official HDFC Bank app. Under Profile > KYC Status, it shows: "KYC Status: COMPLETE. No action required." There is no pending KYC notification anywhere in the app.',
        contextNote: 'Your official bank app shows no KYC issues.',
        choices: [
          {
            id: 'kyc-2-good-a',
            text: 'The caller was a fraudster — file a cybercrime complaint',
            isSafe: true,
            feedbackTitle: 'Hero Move! Reporting Scams Protects Others',
            feedbackExplanation: 'Filing a complaint at cybercrime.gov.in or calling 1930 helps authorities track and shut down scam operations. Your report could prevent the same scam from victimizing someone else.',
            redFlags: [],
            xpGained: 40,
            isTerminal: true,
          },
          {
            id: 'kyc-2-good-b',
            text: 'Good, KYC is fine. Just ignore the call.',
            isSafe: true,
            feedbackTitle: 'Correct, but Reporting Would Help More',
            feedbackExplanation: 'You are safe, but these scam numbers often target hundreds of people. Reporting to 1930 (National Cybercrime Helpline) takes 2 minutes and can save others from falling victim.',
            redFlags: [],
            xpGained: 20,
            isTerminal: true,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 3. REFUND SCAM
  // ────────────────────────────────────────────────────────────
  {
    slug: 'refund-scam',
    title: 'Refund Reversal Trap',
    description: 'A "bank executive" says you are owed a refund but needs your UPI PIN to process it. Classic reversal scam.',
    category: 'refund_scam',
    difficulty: 'intermediate',
    xpReward: 150,
    emoji: '💰',
    tips: [
      'To receive money, you NEVER need to enter a PIN or scan a QR code',
      'Refunds are credited automatically by banks, no action needed',
      'Entering your UPI PIN means you are PAYING, not receiving',
      'Any "executive" asking for your PIN is a fraudster',
    ],
    steps: [
      {
        id: 'rs-1',
        order: 1,
        messageType: 'whatsapp',
        sender: 'Customer Care',
        senderHandle: '+91-9123456789',
        content: 'Dear Customer,\n\nYour recent transaction of ₹5,000 failed but was debited from your account. We are processing your refund.\n\nTo receive your refund, please share:\n1. UPI ID\n2. Bank account number\n3. UPI PIN (for verification)\n\nRefund will be credited within 10 minutes.\n\n- ICICI Bank Customer Support',
        contextNote: 'You did have a failed UPI transaction last week.',
        isEntryPoint: true,
        choices: [
          {
            id: 'rs-1-a',
            text: 'Share your UPI ID and account number',
            isSafe: false,
            feedbackTitle: 'Risky! Partial Information Still Dangerous',
            feedbackExplanation: 'Your UPI ID reveals your bank, and combined with your account number, fraudsters can attempt fraud through other channels. But the REAL danger is next — they will now ask for your UPI PIN.',
            redFlags: ['WhatsApp is not an official support channel', 'Unknown number claiming to be bank', 'Asking for sensitive account details'],
            xpGained: 0,
            nextStepId: 'rs-2-bad',
          },
          {
            id: 'rs-1-b',
            text: 'Share UPI PIN too — it\'s needed for verification',
            isSafe: false,
            feedbackTitle: 'Critical Mistake! UPI PIN is NEVER Shared',
            feedbackExplanation: 'Your UPI PIN is like your ATM PIN. Sharing it means the scammer can now initiate transactions FROM your account. "Verification" is a lie — banks NEVER need your PIN to send you a refund.',
            redFlags: ['Requesting UPI PIN', 'WhatsApp support is fake', 'Refunds do not require PIN'],
            xpGained: 0,
            nextStepId: 'rs-2-bad',
          },
          {
            id: 'rs-1-c',
            text: 'Ignore — real banks don\'t ask for PIN over WhatsApp',
            isSafe: true,
            feedbackTitle: 'Spot On! PIN Requests Are Always Scams',
            feedbackExplanation: 'This is the classic refund scam. To RECEIVE money via UPI, you only need to share your UPI ID — nothing else. No bank, no app, no platform ever needs your UPI PIN to credit money to you.',
            redFlags: [],
            xpGained: 40,
            nextStepId: 'rs-2-good',
          },
        ],
      },
      {
        id: 'rs-2-bad',
        order: 2,
        messageType: 'app_screen',
        sender: 'Your UPI App',
        content: 'A payment request notification appears:\n\n"ICICI BANK REFUND"\nAmount: ₹5,000\n\nEnter UPI PIN to RECEIVE refund:\n[_ _ _ _ _ _]\n\nTimer: 02:34 remaining',
        contextNote: 'A collect request appears on your UPI app.',
        choices: [
          {
            id: 'rs-2-bad-a',
            text: 'Enter my UPI PIN to receive the refund',
            isSafe: false,
            feedbackTitle: 'You Just Sent ₹5,000 to a Scammer!',
            feedbackExplanation: 'CRITICAL LESSON: On UPI, entering your PIN on a COLLECT REQUEST means you are AUTHORIZING A PAYMENT from your account. The screen said "receive" but you actually SENT ₹5,000. This is why this scam is called the "refund reversal" — they trick you into paying them.',
            redFlags: ['Entering PIN = sending money', 'Collect requests are payment debits', 'Timer creates fake urgency'],
            xpGained: 0,
            isTerminal: true,
          },
          {
            id: 'rs-2-bad-b',
            text: 'Decline the payment request — this looks suspicious',
            isSafe: true,
            feedbackTitle: 'Good Recovery! Declined in Time',
            feedbackExplanation: 'A collect request on UPI always DEBITS your account when you enter the PIN. This was a payment request disguised as a refund. Declining was the right call. Block the number and report to 1930.',
            redFlags: [],
            xpGained: 25,
            isTerminal: true,
          },
        ],
      },
      {
        id: 'rs-2-good',
        order: 2,
        messageType: 'app_screen',
        sender: 'Your UPI App',
        content: 'You check your transaction history in your UPI app. You see the failed transaction from last week. Status shows: "FAILED - Auto-refund initiated. Will reflect in 5-7 business days per NPCI guidelines."',
        contextNote: 'The app already shows automatic refund is processing.',
        choices: [
          {
            id: 'rs-2-good-a',
            text: 'Wait for the automatic refund — no action needed',
            isSafe: true,
            feedbackTitle: 'Perfect Understanding of UPI Refunds!',
            feedbackExplanation: 'By NPCI rules, failed UPI transactions are automatically reversed within 5-7 business days. You never need to "request" or "initiate" a refund — it happens automatically. If it doesn\'t, raise a dispute through the official app.',
            redFlags: [],
            xpGained: 50,
            isTerminal: true,
          },
          {
            id: 'rs-2-good-b',
            text: 'Raise a dispute through the official app just to be safe',
            isSafe: true,
            feedbackTitle: 'Also Correct! Using Official Channels is Always Safe',
            feedbackExplanation: 'Raising a dispute through the official UPI app is a legitimate way to follow up. Just ensure you are using the genuine app downloaded from Google Play/App Store.',
            redFlags: [],
            xpGained: 35,
            isTerminal: true,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 4. UPI QR SCAM
  // ────────────────────────────────────────────────────────────
  {
    slug: 'upi-qr-scam',
    title: 'Scan to Receive Money',
    description: 'Someone on OLX offers to pay you but asks you to scan a QR code first. Do you understand the trap?',
    category: 'upi_scam',
    difficulty: 'intermediate',
    xpReward: 150,
    emoji: '📱',
    tips: [
      'QR codes are for SENDING money, never for receiving',
      'Anyone claiming you need to scan to receive payment is a scammer',
      'On UPI, to receive money you only need to share your UPI ID',
      'Never enter your PIN after scanning an unknown QR code',
    ],
    steps: [
      {
        id: 'upi-1',
        order: 1,
        messageType: 'whatsapp',
        sender: 'Buyer (OLX)',
        senderHandle: '+91-7654321098',
        content: 'Hi! I saw your laptop listing on OLX. I want to buy it for ₹25,000. I will pay via UPI. My bank app has a glitch so I need to transfer from a business account. Please scan this QR code with your UPI app — it will verify your account and I can send the full amount. No PIN needed from your side.',
        contextNote: 'You have listed your old laptop on OLX for ₹25,000.',
        isEntryPoint: true,
        choices: [
          {
            id: 'upi-1-a',
            text: 'Scan the QR code — he says no PIN needed',
            isSafe: false,
            feedbackTitle: 'Danger! QR Codes Are for Sending, Not Receiving',
            feedbackExplanation: 'This QR code is a payment request FROM you TO the scammer. When you scan it, your UPI app will ask for your PIN. If you enter it, YOU will pay HIM. The "no PIN needed" claim is a lie to lower your guard.',
            redFlags: ['QR code to receive money is impossible', '"Business account glitch" excuse', 'OLX stranger asking for scan'],
            xpGained: 0,
            nextStepId: 'upi-2-bad',
          },
          {
            id: 'upi-1-b',
            text: 'Ask him to send money directly to your UPI ID instead',
            isSafe: true,
            feedbackTitle: 'Smart! UPI ID is All You Need to Receive Money',
            feedbackExplanation: 'To receive UPI payment, you only need to share your UPI ID (like name@upi). The sender enters YOUR ID and sends money. You do nothing. Anyone who says you need to "scan" or "enter PIN" to receive money is lying.',
            redFlags: [],
            xpGained: 40,
            nextStepId: 'upi-2-good',
          },
          {
            id: 'upi-1-c',
            text: 'Refuse and report the chat to OLX',
            isSafe: true,
            feedbackTitle: 'Excellent! Protecting Yourself and Others',
            feedbackExplanation: 'Reporting this scam to OLX helps remove the fraudster\'s profile and protects other sellers. This QR code scam targeting OLX/Facebook Marketplace sellers is extremely common.',
            redFlags: [],
            xpGained: 45,
            nextStepId: 'upi-2-good',
          },
        ],
      },
      {
        id: 'upi-2-bad',
        order: 2,
        messageType: 'app_screen',
        sender: 'Your UPI App',
        content: 'QR Code Scanned Successfully!\n\nPaying to: BIZPAY SOLUTIONS\nAmount: ₹10\n\n"This is just for verification. After you pay ₹10 test amount, the full ₹25,000 will be sent to you automatically."\n\nEnter UPI PIN to confirm:',
        contextNote: 'The QR was for sending a test payment.',
        choices: [
          {
            id: 'upi-2-bad-a',
            text: 'Pay the ₹10 test — it\'s just verification',
            isSafe: false,
            feedbackTitle: 'Scam Progressing! Never Pay to Get Paid',
            feedbackExplanation: 'After the ₹10 "test," the scammer will send another QR for ₹2,500 (claiming your account limit), then disappear. Each payment confirms your PIN works. You will never receive ₹25,000. Never pay any amount to "verify" a sale.',
            redFlags: ['Paying to receive payment', 'Test amount is bait', '"Automatic transfer" is a lie'],
            xpGained: 0,
            isTerminal: true,
          },
          {
            id: 'upi-2-bad-b',
            text: 'Close the app — this does not make sense',
            isSafe: true,
            feedbackTitle: 'Good Recovery! Trust Your Instinct',
            feedbackExplanation: 'A legitimate buyer NEVER needs you to pay even ₹1 to receive your payment. The moment any "buyer" asks you to make a payment (however small), it\'s a scam. You protected yourself by stopping here.',
            redFlags: [],
            xpGained: 20,
            isTerminal: true,
          },
        ],
      },
      {
        id: 'upi-2-good',
        order: 2,
        messageType: 'whatsapp',
        sender: 'Buyer (OLX)',
        senderHandle: '+91-7654321098',
        content: '"Oh, sharing your UPI ID is not possible with my bank. Just scan this QR, it\'s safe, I promise. All OLX sellers do this. If you don\'t trust me, I will buy from someone else."',
        contextNote: 'The buyer pushes back and creates FOMO pressure.',
        choices: [
          {
            id: 'upi-2-good-a',
            text: 'Stick to your position — demand direct UPI transfer or cash',
            isSafe: true,
            feedbackTitle: 'Standing Firm is the Right Call!',
            feedbackExplanation: 'Pressure tactics like "other sellers do this" or "I will buy elsewhere" are designed to make you doubt yourself. A real buyer has no problem paying to a UPI ID. Your position is 100% correct — walk away from this deal.',
            redFlags: [],
            xpGained: 50,
            isTerminal: true,
          },
          {
            id: 'upi-2-good-b',
            text: 'Agree to meet in person for cash payment instead',
            isSafe: true,
            feedbackTitle: 'Smart Alternative! Cash in Person is Safest',
            feedbackExplanation: 'For high-value OLX deals, meeting in a public place and accepting cash (or verifying UPI payment before handing over goods) is the safest approach.',
            redFlags: [],
            xpGained: 40,
            isTerminal: true,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 5. LOTTERY PHISHING
  // ────────────────────────────────────────────────────────────
  {
    slug: 'lottery-phishing',
    title: 'You Won a Prize!',
    description: 'An email claims you won a ₹50 lakh lottery. Learn to spot phishing emails before clicking anything.',
    category: 'lottery_scam',
    difficulty: 'beginner',
    xpReward: 100,
    emoji: '🎰',
    tips: [
      'You cannot win a lottery you never entered',
      'Check the actual sender email domain carefully',
      'Legitimate prizes never ask for upfront fees',
      'Hover over links before clicking to see the real URL',
    ],
    steps: [
      {
        id: 'lt-1',
        order: 1,
        messageType: 'email',
        sender: 'PM Lottery Award Dept',
        senderHandle: 'award.claim@pm-india-lottery.net',
        content: 'Subject: URGENT: You have won ₹50,00,000 in the PM Digital India Lottery!\n\nDear Lucky Winner,\n\nYour mobile number has been selected in the Government of India PM Digital India Lottery 2024. You have won FIFTY LAKH RUPEES (₹50,00,000).\n\nTo claim your prize within 48 hours:\n1. Click: www.pm-india-lottery-claim.net/claim\n2. Pay ₹2,500 registration tax\n3. Provide your bank details for transfer\n\nLottery ID: PMIL-2024-88934\nClaim Officer: Mr. Ramesh Kumar\nDirect: +91-9087654321\n\nThis offer expires in 48 HOURS.',
        contextNote: 'This email arrives in your inbox.',
        isEntryPoint: true,
        choices: [
          {
            id: 'lt-1-a',
            text: 'Click the link to claim — ₹50 lakh is life-changing!',
            isSafe: false,
            feedbackTitle: 'Phishing Attack! Never Click Such Links',
            feedbackExplanation: 'The link "pm-india-lottery-claim.net" is a fake government site. Clicking it will install malware or lead to a fake form that steals your personal and banking details. The domain ".net" is NOT a government domain (which would be ".gov.in").',
            redFlags: ['Not .gov.in domain', 'Lottery you never entered', '48-hour urgency', 'Upfront "registration tax"'],
            xpGained: 0,
            nextStepId: 'lt-2-bad',
          },
          {
            id: 'lt-1-b',
            text: 'Check the sender email domain carefully',
            isSafe: true,
            feedbackTitle: 'Great Habit! Email Domain Checking Saves You',
            feedbackExplanation: 'The sender is "pm-india-lottery.net" — NOT gov.in. The Indian government only uses @nic.in or @gov.in email addresses. Any "government" email from .net, .com, .org, .xyz is a fake.',
            redFlags: [],
            xpGained: 35,
            nextStepId: 'lt-2-good',
          },
          {
            id: 'lt-1-c',
            text: 'Delete the email — you never entered any lottery',
            isSafe: true,
            feedbackTitle: 'Correct Reasoning! You Cannot Win What You Didn\'t Enter',
            feedbackExplanation: 'This is the simplest test: did you enter a lottery? No? Then you cannot win one. No legitimate lottery selects people who never participated. This is a universal rule.',
            redFlags: [],
            xpGained: 30,
            nextStepId: 'lt-2-good',
          },
        ],
      },
      {
        id: 'lt-2-bad',
        order: 2,
        messageType: 'app_screen',
        sender: 'Fake Lottery Website',
        content: 'Congratulations! Lottery ID PMIL-2024-88934 Verified!\n\nTo release your ₹50,00,000 prize:\n\nStep 1: Pay ₹2,500 Registration Tax\nStep 2: Pay ₹5,000 TDS Certificate Fee  \nStep 3: Pay ₹8,000 RBI Clearance Fee\n\n"Previous winners paid these fees and received their crores!"',
        contextNote: 'The fake site keeps adding fees.',
        choices: [
          {
            id: 'lt-2-bad-a',
            text: 'Pay the ₹2,500 registration tax first',
            isSafe: false,
            feedbackTitle: 'Advance Fee Fraud — Fees Will Never Stop',
            feedbackExplanation: 'This is "advance fee fraud" (419 scam). You will pay ₹2,500, then ₹5,000, then ₹8,000... each time a new fee appears. The prize never comes. Victims have lost lakhs chasing a prize that never existed.',
            redFlags: ['Escalating fees', 'Multiple government-sounding charges', 'Prize never materializes'],
            xpGained: 0,
            isTerminal: true,
          },
          {
            id: 'lt-2-bad-b',
            text: 'Close the site — too many fees is suspicious',
            isSafe: true,
            feedbackTitle: 'You Stopped the Drain in Time',
            feedbackExplanation: 'The fee escalation pattern is the hallmark of advance fee fraud. You recognized it and stopped. Report this site to https://cybercrime.gov.in to protect others.',
            redFlags: [],
            xpGained: 20,
            isTerminal: true,
          },
        ],
      },
      {
        id: 'lt-2-good',
        order: 2,
        messageType: 'email',
        sender: 'You',
        content: 'You want to verify if this lottery is real. You Google "PM Digital India Lottery official". You find a Press Information Bureau (PIB) fact-check article: "FAKE: No such lottery exists. These are scam emails targeting citizens. PIB Fact Check has debunked this."',
        contextNote: 'A simple Google search reveals the truth.',
        choices: [
          {
            id: 'lt-2-good-a',
            text: 'Share the PIB fact-check with family to warn them',
            isSafe: true,
            feedbackTitle: 'Community Hero! Spreading Awareness is Powerful',
            feedbackExplanation: 'Elderly parents and relatives are prime targets for lottery scams. Sharing verified fact-checks from PIB (pib.gov.in) helps protect your family. PIB Fact Check is the government\'s official misinformation debunking service.',
            redFlags: [],
            xpGained: 45,
            isTerminal: true,
          },
          {
            id: 'lt-2-good-b',
            text: 'Mark email as phishing and delete it',
            isSafe: true,
            feedbackTitle: 'Right Action! Marking Trains Email Filters',
            feedbackExplanation: 'Marking as phishing (not just spam) trains email providers to block similar emails for everyone. Gmail and Outlook use this data to protect millions of users.',
            redFlags: [],
            xpGained: 30,
            isTerminal: true,
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 6. FAKE APP DOWNLOAD
  // ────────────────────────────────────────────────────────────
  {
    slug: 'fake-app-download',
    title: 'Official Bank App Update',
    description: 'A WhatsApp message sends you a link to download a critical bank app security update. Is it real?',
    category: 'phishing',
    difficulty: 'advanced',
    xpReward: 200,
    emoji: '📲',
    tips: [
      'Only download banking apps from Google Play Store or Apple App Store',
      'Banks never send app updates via WhatsApp, SMS, or email links',
      'APK files from unknown sources can be trojans that steal banking data',
      'App updates happen automatically through the official store',
    ],
    steps: [
      {
        id: 'fa-1',
        order: 1,
        messageType: 'whatsapp',
        sender: 'Unknown Number',
        senderHandle: '+91-8123456789',
        content: 'IMPORTANT SECURITY UPDATE FROM AXIS BANK\n\nDear Valued Customer,\n\nA critical security vulnerability has been detected in your Axis Mobile app. Your account may be at risk.\n\nDownload the OFFICIAL security patch immediately:\n[Download AxisMobile_Security_v2.1.apk]\n\nThis update MUST be installed within 24 hours to prevent unauthorized access.\n\n- Axis Bank Security Team',
        contextNote: 'You use Axis Bank. This message seems urgent.',
        isEntryPoint: true,
        choices: [
          {
            id: 'fa-1-a',
            text: 'Download and install the APK file immediately',
            isSafe: false,
            feedbackTitle: 'Critical Risk! Installing Malware',
            feedbackExplanation: 'This APK is malware — likely a banking trojan that overlays fake login screens on top of real apps to steal your credentials, reads OTPs, and sends your data to scammers. Never install APK files from outside the official app stores.',
            redFlags: ['APK file outside Play Store', 'WhatsApp message not official channel', 'Unknown number', '24-hour urgency'],
            xpGained: 0,
            nextStepId: 'fa-2-bad',
          },
          {
            id: 'fa-1-b',
            text: 'Check Google Play Store for official Axis Bank app update',
            isSafe: true,
            feedbackTitle: 'Perfect! Official Store = Official Updates',
            feedbackExplanation: 'The only safe way to update a banking app is through Google Play Store (Android) or App Store (iOS). If a critical update exists, it will appear there. WhatsApp is NEVER a distribution channel for bank app updates.',
            redFlags: [],
            xpGained: 50,
            nextStepId: 'fa-2-good',
          },
          {
            id: 'fa-1-c',
            text: 'Call Axis Bank customer care to verify',
            isSafe: true,
            feedbackTitle: 'Good Verification Mindset!',
            feedbackExplanation: 'Calling the official number (found on the bank\'s website or your card) to verify is a good practice. Axis Bank will confirm they never send security updates via WhatsApp.',
            redFlags: [],
            xpGained: 40,
            nextStepId: 'fa-2-good',
          },
        ],
      },
      {
        id: 'fa-2-bad',
        order: 2,
        messageType: 'app_screen',
        sender: 'Fake Axis Bank App',
        content: 'Installing AxisMobile_Security_v2.1.apk...\n\nThis app requests permissions:\n• Read all SMS messages\n• Read contacts\n• Record audio\n• Take screenshots\n• Overlay on other apps\n• Internet access\n\n[Accept All] [Cancel]',
        contextNote: 'The APK install screen shows alarming permissions.',
        choices: [
          {
            id: 'fa-2-bad-a',
            text: 'Accept all permissions — security apps need access',
            isSafe: false,
            feedbackTitle: 'Your Phone is Now Compromised',
            feedbackExplanation: 'These permissions give the malware: SMS reading (captures OTPs), screen overlay (fake login over real apps), audio recording. This is a Remote Access Trojan (RAT). Every banking credential you type, every OTP you receive is now sent to scammers.',
            redFlags: ['SMS read = OTP theft', 'Overlay = fake login screens', 'Audio recording = illegal surveillance'],
            xpGained: 0,
            isTerminal: true,
          },
          {
            id: 'fa-2-bad-b',
            text: 'Cancel installation — these permissions are suspicious',
            isSafe: true,
            feedbackTitle: 'You Stopped a Trojan Installation!',
            feedbackExplanation: 'A bank app does NOT need to read all SMS, record audio, or overlay on other apps. These permissions are red flags for malware. Delete the APK file immediately and run a security scan.',
            redFlags: [],
            xpGained: 30,
            isTerminal: true,
          },
        ],
      },
      {
        id: 'fa-2-good',
        order: 2,
        messageType: 'app_screen',
        sender: 'Google Play Store',
        content: 'Axis Mobile - Axis Bank\n\nVersion: 8.4.2 (Latest)\nLast updated: 3 days ago\nDeveloper: Axis Bank Ltd. (Verified)\nDownloads: 10M+\nRating: 4.2★\n\n"Your app is up to date. No update required."',
        contextNote: 'Play Store shows the app is already up to date.',
        choices: [
          {
            id: 'fa-2-good-a',
            text: 'Report the WhatsApp number and warn contacts',
            isSafe: true,
            feedbackTitle: 'Community Protector! Report and Warn',
            feedbackExplanation: 'Reporting the number on WhatsApp and warning your contacts prevents this malware from spreading. These fake APK links are often sent to all contacts once a device is infected.',
            redFlags: [],
            xpGained: 60,
            isTerminal: true,
          },
          {
            id: 'fa-2-good-b',
            text: 'Block the number — it was a scam attempt',
            isSafe: true,
            feedbackTitle: 'Correct! Block and Stay Safe',
            feedbackExplanation: 'Blocking prevents further attempts. You correctly verified through official channels that no update was needed. This entire scenario was a social engineering attack.',
            redFlags: [],
            xpGained: 40,
            isTerminal: true,
          },
        ],
      },
    ],
  },
]

export function getScenarioBySlug(slug: string): ScenarioData | undefined {
  return SCENARIOS.find((s) => s.slug === slug)
}

export function getStepById(scenario: ScenarioData, stepId: string): ScenarioStep | undefined {
  return scenario.steps.find((s) => s.id === stepId)
}

export function getEntryStep(scenario: ScenarioData): ScenarioStep | undefined {
  return scenario.steps.find((s) => s.isEntryPoint) || scenario.steps[0]
}
