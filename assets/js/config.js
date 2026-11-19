/* Healthy.Life settings. Edit values here; no other file needs to change. */
window.HL_CONFIG = {
  /* Form inbox, stored encoded and decoded only at the moment a form is sent.
     Never replace this with a plain address. */
  inbox: [82, 64, 71, 82, 74, 87, 78, 86, 68, 20, 101, 66, 72, 68, 76, 73, 11, 70, 74, 72],
  inboxKey: 37,
  formEndpoint: "https://formsubmit.co/ajax/",
  formFallback: "https://formsubmit.co/",

  /* Google AdSense. Auto ads run from the script in every page head.
     After approval, paste display-unit slot IDs here to switch on the fixed placements. */
  adClient: "ca-pub-6620975821265271",
  adSlots: { "in-content": "", "tool": "", "home": "" },

  /* Payment links for the Support page. While these are blank the page collects pledges
     and you reply with a payment link. */
  donate: {
    paypal: "",        /* e.g. https://www.paypal.com/donate/?hosted_button_id=XXXX */
    stripe: "",        /* e.g. https://buy.stripe.com/XXXX (one-time) */
    stripeMonthly: "", /* e.g. https://buy.stripe.com/YYYY (monthly) */
    bmc: ""            /* e.g. https://buymeacoffee.com/yourname */
  },

  /* The contest shown on contests.html and the home page.
     The prize is a public promise: confirm or change it before promoting the page. */
  contest: {
    name: "New Year Reset",
    month: "January 2027",
    prize: "US$100 gift card (winner's choice of major retailer, where available)",
    runnerUp: "Two runners-up: US$25 gift card each, plus a feature on the site",
    closes: "2027-01-31T23:59:00-05:00",
    sponsor: ""
  },

  /* Interface switches */
  stickyCta: true,
  cookieNotice: true
};
