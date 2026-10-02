/**
 * Все сведения, которые могут меняться, собраны в этом файле.
 * Сохраняйте кавычки и запятые при редактировании значений.
 */
window.SITE_CONFIG = {
  seller: {
    fullName: "Индивидуальный предприниматель Куприянова Ольга Владимировна",
    shortName: "ИП Куприянова О.В.",
    legalAddress: "Россия, 305512, Курская область, Курский район, посёлок Камыши, дом 29, квартира 11",
    postalAddress: "Россия, 400075, г. Волгоград, шоссе Авиаторов, д. 9",
    ogrnip: "323460000052391",
    inn: "344309962847",
    registrationDate: "13.12.2023",
    okved: "46.44",
    phone: "+78442549810",
    phoneLink: "+78442549810",
    email: "VR-SKLAD-OLGA@MAIL.RU",
    bank: {
      account: "40802810111000068159",
      name: "Волгоградское отделение № 8621 ПАО Сбербанк",
      bik: "041806647",
      correspondentAccount: "30101810100000000647"
    }
  },
  schedule: { days: "Понедельник — воскресенье", open: "09:00", close: "20:00", note: "Без перерывов и выходных", timeZone: "Europe/Volgograd" },
  documents: [
    { id: "inn", title: "Свидетельство о постановке на налоговый учёт (ИНН)", type: "image", path: "assets/documents/ИНН Куприянова.jpg", thumbnail: "assets/documents/inn-thumb.jpg", available: true },
    { id: "egrip", title: "Лист записи ЕГРИП", type: "pdf", path: "assets/documents/ЕГРИП.pdf", thumbnail: "assets/documents/egrip-thumb.jpg", pages: 3, available: true },
  ],
  emergencyPhones: [
    { name: "Пожарная охрана", number: "101" }, { name: "Полиция", number: "102" },
    { name: "Скорая помощь", number: "103" }, { name: "Аварийная газовая служба", number: "104" },
    { name: "Единый номер экстренных служб", number: "112" }
  ],
  authorityPhones: [
    { name: "Комитет по защите прав потребителей по Волгоградской области", number: "(8442) 24-36-30", tel: "+78442243630" },
    { name: "ИФНС по Волгоградской области", number: "8-800-222-2222", tel: "+78002222222" }
  ]
};
