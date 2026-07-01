// scripts/i18n-add-onboarding-paywall.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Injeta os namespaces `onboarding` e `paywall` em cada locale de lib/i18n/locales.
// Mantém as chaves já existentes e faz merge profundo. Rode uma vez:
//   node scripts/i18n-add-onboarding-paywall.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(__dirname, "..", "lib", "i18n", "locales");

// Blocos por idioma (onboarding + paywall). `en` é a referência canônica.
const DATA = {
  en: {
    onboarding: {
      next: "Next",
      start: "Let's go 👍",
      slides: {
        welcome: {
          badge: "Welcome to Pedagogy",
          title: "Stories that teach\nand delight",
          description:
            "Pedagogy is a children's story app with educational content, designed to develop kids aged 2–10 in a playful and engaging way.",
        },
        library: {
          badge: "Infinite library",
          title: "Hundreds of stories\nto explore",
          description:
            "Fables, adventures, science and more. New content every month, with audio narration and colourful illustrations.",
        },
        learning: {
          badge: "Real learning",
          title: "Track your child's\nprogress",
          description:
            "Quizzes, achievements and reading reports for parents. Teaching has never been this fun and easy to follow.",
        },
      },
    },
    paywall: {
      period: {
        annual: "Annual",
        sixMonth: "6 Months",
        threeMonth: "3 Months",
        twoMonth: "2 Months",
        monthly: "Monthly",
        weekly: "Weekly",
      },
      periodShort: {
        year: "/year",
        sixMo: "/6 mo",
        threeMo: "/3 mo",
        month: "/month",
        week: "/week",
      },
      units: { day: "day", week: "week", month: "month", year: "year" },
      tryFree: "{{count}} {{unit}} free trial",
      mostPopular: "🏆 Most popular",
      hero: {
        title: "Unlock a world of stories for your child",
        subtitle: "Over 50 adventures waiting for your little reader",
      },
      features: {
        stories: "Access to over 50 stories",
        activities: "Educational activities and mini-games",
      },
      choosePlan: "Choose your plan",
      loadingPlans: "Loading plans...",
      loadError: "Failed to load plans. Please try again.",
      gateNotice: "Every purchase is protected by a parental gate.",
      cta: "🎉 Start Now!",
      ctaSub: "Then {{price}} · Cancel anytime",
      restore: "Restore Purchases",
      whyTitle: "Why families choose Pedagogy",
      trust: {
        safeTitle: "Safe for kids",
        safeText: "Purchases and links are protected by a parental gate.",
        noAdsTitle: "No third-party ads",
        noAdsText: "A calm, distraction-free space to read and learn.",
        cancelTitle: "Cancel anytime",
        cancelText: "Manage your plan anytime in your account settings.",
      },
      finePrint:
        "Billing is done automatically. You can cancel at any time in your account settings. By subscribing, you agree to our",
      finePrintAnd: "and",
      terms: "Terms of Use (EULA)",
      privacy: "Privacy Policy",
      alerts: {
        activeTitle: "🎉 Subscription Active!",
        activeBody: "Your stories are unlocked. Happy reading!",
        activeCta: "Let's go!",
        errorTitle: "Something went wrong",
        restoredTitle: "✅ Purchase Restored",
        restoredBody: "Your subscription has been restored.",
        restoredCta: "Continue",
        restoreFailedTitle: "Restore Failed",
        noSubTitle: "No Active Subscription",
        noSubBody:
          "We couldn't find a previous purchase linked to this account.",
      },
    },
  },

  pt: {
    onboarding: {
      next: "Próximo",
      start: "Vamos lá 👍",
      slides: {
        welcome: {
          badge: "Bem-vindo ao Pedagogy",
          title: "Histórias que ensinam\ne encantam",
          description:
            "O Pedagogy é um app de histórias infantis com conteúdo educativo, feito para desenvolver crianças de 2 a 10 anos de um jeito lúdico e envolvente.",
        },
        library: {
          badge: "Biblioteca infinita",
          title: "Centenas de histórias\npara explorar",
          description:
            "Fábulas, aventuras, ciência e muito mais. Conteúdo novo todo mês, com narração em áudio e ilustrações coloridas.",
        },
        learning: {
          badge: "Aprendizado de verdade",
          title: "Acompanhe o progresso\ndo seu filho",
          description:
            "Quizzes, conquistas e relatórios de leitura para os pais. Ensinar nunca foi tão divertido e fácil de acompanhar.",
        },
      },
    },
    paywall: {
      period: {
        annual: "Anual",
        sixMonth: "6 meses",
        threeMonth: "3 meses",
        twoMonth: "2 meses",
        monthly: "Mensal",
        weekly: "Semanal",
      },
      periodShort: {
        year: "/ano",
        sixMo: "/6 meses",
        threeMo: "/3 meses",
        month: "/mês",
        week: "/semana",
      },
      units: { day: "dia", week: "semana", month: "mês", year: "ano" },
      tryFree: "{{count}} {{unit}} grátis",
      mostPopular: "🏆 Mais popular",
      hero: {
        title: "Abra um mundo de histórias para o seu filho",
        subtitle: "Mais de 50 aventuras esperando pelo seu pequeno leitor",
      },
      features: {
        stories: "Acesso a mais de 50 histórias",
        activities: "Atividades educativas e minijogos",
      },
      choosePlan: "Escolha seu plano",
      loadingPlans: "Carregando planos...",
      loadError: "Não foi possível carregar os planos. Tente novamente.",
      gateNotice: "Toda compra é protegida por um portão parental.",
      cta: "🎉 Começar agora!",
      ctaSub: "Depois {{price}} · Cancele quando quiser",
      restore: "Restaurar compras",
      whyTitle: "Por que as famílias escolhem o Pedagogy",
      trust: {
        safeTitle: "Seguro para crianças",
        safeText: "Compras e links são protegidos por um portão parental.",
        noAdsTitle: "Sem anúncios de terceiros",
        noAdsText: "Um espaço calmo e sem distrações para ler e aprender.",
        cancelTitle: "Cancele quando quiser",
        cancelText:
          "Gerencie seu plano a qualquer momento nas configurações da sua conta.",
      },
      finePrint:
        "A cobrança é feita automaticamente. Você pode cancelar quando quiser nas configurações da sua conta. Ao assinar, você concorda com nossos",
      finePrintAnd: "e",
      terms: "Termos de Uso (EULA)",
      privacy: "Política de Privacidade",
      alerts: {
        activeTitle: "🎉 Assinatura ativa!",
        activeBody: "Suas histórias foram desbloqueadas. Boa leitura!",
        activeCta: "Vamos lá!",
        errorTitle: "Algo deu errado",
        restoredTitle: "✅ Compra restaurada",
        restoredBody: "Sua assinatura foi restaurada.",
        restoredCta: "Continuar",
        restoreFailedTitle: "Falha ao restaurar",
        noSubTitle: "Nenhuma assinatura ativa",
        noSubBody:
          "Não encontramos uma compra anterior vinculada a esta conta.",
      },
    },
  },

  es: {
    onboarding: {
      next: "Siguiente",
      start: "¡Vamos! 👍",
      slides: {
        welcome: {
          badge: "Bienvenido a Pedagogy",
          title: "Historias que enseñan\ny encantan",
          description:
            "Pedagogy es una app de cuentos infantiles con contenido educativo, diseñada para desarrollar a niños de 2 a 10 años de forma lúdica y envolvente.",
        },
        library: {
          badge: "Biblioteca infinita",
          title: "Cientos de historias\npor explorar",
          description:
            "Fábulas, aventuras, ciencia y mucho más. Contenido nuevo cada mes, con narración en audio e ilustraciones coloridas.",
        },
        learning: {
          badge: "Aprendizaje real",
          title: "Sigue el progreso\nde tu hijo",
          description:
            "Cuestionarios, logros e informes de lectura para los padres. Enseñar nunca fue tan divertido y fácil de seguir.",
        },
      },
    },
    paywall: {
      period: {
        annual: "Anual",
        sixMonth: "6 meses",
        threeMonth: "3 meses",
        twoMonth: "2 meses",
        monthly: "Mensual",
        weekly: "Semanal",
      },
      periodShort: {
        year: "/año",
        sixMo: "/6 meses",
        threeMo: "/3 meses",
        month: "/mes",
        week: "/semana",
      },
      units: { day: "día", week: "semana", month: "mes", year: "año" },
      tryFree: "{{count}} {{unit}} gratis",
      mostPopular: "🏆 Más popular",
      hero: {
        title: "Abre un mundo de historias para tu hijo",
        subtitle: "Más de 50 aventuras esperando a tu pequeño lector",
      },
      features: {
        stories: "Acceso a más de 50 historias",
        activities: "Actividades educativas y minijuegos",
      },
      choosePlan: "Elige tu plan",
      loadingPlans: "Cargando planes...",
      loadError: "No se pudieron cargar los planes. Inténtalo de nuevo.",
      gateNotice: "Cada compra está protegida por un control parental.",
      cta: "🎉 ¡Empezar ahora!",
      ctaSub: "Luego {{price}} · Cancela cuando quieras",
      restore: "Restaurar compras",
      whyTitle: "Por qué las familias eligen Pedagogy",
      trust: {
        safeTitle: "Seguro para niños",
        safeText: "Las compras y los enlaces están protegidos por un control parental.",
        noAdsTitle: "Sin anuncios de terceros",
        noAdsText: "Un espacio tranquilo y sin distracciones para leer y aprender.",
        cancelTitle: "Cancela cuando quieras",
        cancelText:
          "Gestiona tu plan cuando quieras en la configuración de tu cuenta.",
      },
      finePrint:
        "El cobro se realiza automáticamente. Puedes cancelar cuando quieras en la configuración de tu cuenta. Al suscribirte, aceptas nuestros",
      finePrintAnd: "y",
      terms: "Términos de Uso (EULA)",
      privacy: "Política de Privacidad",
      alerts: {
        activeTitle: "🎉 ¡Suscripción activa!",
        activeBody: "Tus historias están desbloqueadas. ¡Feliz lectura!",
        activeCta: "¡Vamos!",
        errorTitle: "Algo salió mal",
        restoredTitle: "✅ Compra restaurada",
        restoredBody: "Tu suscripción ha sido restaurada.",
        restoredCta: "Continuar",
        restoreFailedTitle: "Error al restaurar",
        noSubTitle: "Sin suscripción activa",
        noSubBody:
          "No encontramos una compra anterior vinculada a esta cuenta.",
      },
    },
  },

  fr: {
    onboarding: {
      next: "Suivant",
      start: "C'est parti 👍",
      slides: {
        welcome: {
          badge: "Bienvenue sur Pedagogy",
          title: "Des histoires qui\ninstruisent et enchantent",
          description:
            "Pedagogy est une app d'histoires pour enfants au contenu éducatif, conçue pour faire grandir les enfants de 2 à 10 ans de façon ludique et captivante.",
        },
        library: {
          badge: "Bibliothèque infinie",
          title: "Des centaines d'histoires\nà explorer",
          description:
            "Fables, aventures, sciences et plus encore. Du nouveau contenu chaque mois, avec narration audio et illustrations colorées.",
        },
        learning: {
          badge: "Un vrai apprentissage",
          title: "Suivez les progrès\nde votre enfant",
          description:
            "Quiz, récompenses et rapports de lecture pour les parents. Enseigner n'a jamais été aussi amusant et facile à suivre.",
        },
      },
    },
    paywall: {
      period: {
        annual: "Annuel",
        sixMonth: "6 mois",
        threeMonth: "3 mois",
        twoMonth: "2 mois",
        monthly: "Mensuel",
        weekly: "Hebdomadaire",
      },
      periodShort: {
        year: "/an",
        sixMo: "/6 mois",
        threeMo: "/3 mois",
        month: "/mois",
        week: "/semaine",
      },
      units: { day: "jour", week: "semaine", month: "mois", year: "an" },
      tryFree: "{{count}} {{unit}} gratuit(s)",
      mostPopular: "🏆 Le plus populaire",
      hero: {
        title: "Ouvrez un monde d'histoires à votre enfant",
        subtitle: "Plus de 50 aventures attendent votre petit lecteur",
      },
      features: {
        stories: "Accès à plus de 50 histoires",
        activities: "Activités éducatives et mini-jeux",
      },
      choosePlan: "Choisissez votre formule",
      loadingPlans: "Chargement des formules...",
      loadError: "Impossible de charger les formules. Veuillez réessayer.",
      gateNotice: "Chaque achat est protégé par un contrôle parental.",
      cta: "🎉 Commencer !",
      ctaSub: "Puis {{price}} · Annulable à tout moment",
      restore: "Restaurer les achats",
      whyTitle: "Pourquoi les familles choisissent Pedagogy",
      trust: {
        safeTitle: "Sûr pour les enfants",
        safeText: "Les achats et les liens sont protégés par un contrôle parental.",
        noAdsTitle: "Aucune publicité tierce",
        noAdsText: "Un espace calme et sans distraction pour lire et apprendre.",
        cancelTitle: "Annulable à tout moment",
        cancelText:
          "Gérez votre formule à tout moment dans les réglages de votre compte.",
      },
      finePrint:
        "La facturation est automatique. Vous pouvez annuler à tout moment dans les réglages de votre compte. En vous abonnant, vous acceptez nos",
      finePrintAnd: "et notre",
      terms: "Conditions d'utilisation (CLUF)",
      privacy: "Politique de confidentialité",
      alerts: {
        activeTitle: "🎉 Abonnement actif !",
        activeBody: "Vos histoires sont débloquées. Bonne lecture !",
        activeCta: "C'est parti !",
        errorTitle: "Une erreur est survenue",
        restoredTitle: "✅ Achat restauré",
        restoredBody: "Votre abonnement a été restauré.",
        restoredCta: "Continuer",
        restoreFailedTitle: "Échec de la restauration",
        noSubTitle: "Aucun abonnement actif",
        noSubBody:
          "Nous n'avons trouvé aucun achat précédent lié à ce compte.",
      },
    },
  },

  zh: {
    onboarding: {
      next: "下一步",
      start: "开始吧 👍",
      slides: {
        welcome: {
          badge: "欢迎来到 Pedagogy",
          title: "寓教于乐的\n精彩故事",
          description:
            "Pedagogy 是一款富含教育内容的儿童故事应用，以轻松有趣的方式陪伴 2 至 10 岁孩子成长。",
        },
        library: {
          badge: "无限故事库",
          title: "数百个故事\n等你探索",
          description:
            "寓言、冒险、科学等等。每月更新内容，配有语音朗读和多彩插图。",
        },
        learning: {
          badge: "真正的学习",
          title: "追踪孩子的\n学习进度",
          description:
            "为家长提供测验、成就和阅读报告。教学从未如此有趣、如此易于跟进。",
        },
      },
    },
    paywall: {
      period: {
        annual: "年度",
        sixMonth: "6 个月",
        threeMonth: "3 个月",
        twoMonth: "2 个月",
        monthly: "每月",
        weekly: "每周",
      },
      periodShort: {
        year: "/年",
        sixMo: "/6 个月",
        threeMo: "/3 个月",
        month: "/月",
        week: "/周",
      },
      units: { day: "天", week: "周", month: "个月", year: "年" },
      tryFree: "免费试用 {{count}} {{unit}}",
      mostPopular: "🏆 最受欢迎",
      hero: {
        title: "为孩子开启一个故事的世界",
        subtitle: "50 多个冒险故事，等待你的小读者",
      },
      features: {
        stories: "畅读 50 多个故事",
        activities: "教育活动和小游戏",
      },
      choosePlan: "选择你的方案",
      loadingPlans: "正在加载方案...",
      loadError: "方案加载失败，请重试。",
      gateNotice: "每笔购买都受家长验证保护。",
      cta: "🎉 立即开始！",
      ctaSub: "之后 {{price}} · 随时可取消",
      restore: "恢复购买",
      whyTitle: "家长为何选择 Pedagogy",
      trust: {
        safeTitle: "对孩子安全",
        safeText: "购买和链接均受家长验证保护。",
        noAdsTitle: "没有第三方广告",
        noAdsText: "一个安静、无干扰的阅读与学习空间。",
        cancelTitle: "随时可取消",
        cancelText: "随时可在账户设置中管理你的方案。",
      },
      finePrint:
        "系统将自动扣款。你可以随时在账户设置中取消。订阅即表示你同意我们的",
      finePrintAnd: "和",
      terms: "使用条款（EULA）",
      privacy: "隐私政策",
      alerts: {
        activeTitle: "🎉 订阅已开通！",
        activeBody: "你的故事已解锁，祝阅读愉快！",
        activeCta: "开始吧！",
        errorTitle: "出错了",
        restoredTitle: "✅ 购买已恢复",
        restoredBody: "你的订阅已恢复。",
        restoredCta: "继续",
        restoreFailedTitle: "恢复失败",
        noSubTitle: "没有有效订阅",
        noSubBody: "我们未找到与此账户关联的过往购买记录。",
      },
    },
  },

  hi: {
    onboarding: {
      next: "आगे",
      start: "चलिए शुरू करें 👍",
      slides: {
        welcome: {
          badge: "Pedagogy में आपका स्वागत है",
          title: "ऐसी कहानियाँ जो सिखाएँ\nऔर मन बहलाएँ",
          description:
            "Pedagogy शैक्षिक सामग्री वाली बच्चों की कहानियों का ऐप है, जो 2 से 10 साल के बच्चों को खेल-खेल में और रोचक तरीके से विकसित करने के लिए बनाया गया है।",
        },
        library: {
          badge: "असीमित पुस्तकालय",
          title: "खोजने के लिए\nसैकड़ों कहानियाँ",
          description:
            "दंतकथाएँ, रोमांच, विज्ञान और बहुत कुछ। हर महीने नई सामग्री, ऑडियो वर्णन और रंगीन चित्रों के साथ।",
        },
        learning: {
          badge: "सच्ची सीख",
          title: "अपने बच्चे की\nप्रगति देखें",
          description:
            "माता-पिता के लिए क्विज़, उपलब्धियाँ और पढ़ने की रिपोर्ट। पढ़ाना कभी इतना मज़ेदार और आसान नहीं था।",
        },
      },
    },
    paywall: {
      period: {
        annual: "वार्षिक",
        sixMonth: "6 महीने",
        threeMonth: "3 महीने",
        twoMonth: "2 महीने",
        monthly: "मासिक",
        weekly: "साप्ताहिक",
      },
      periodShort: {
        year: "/वर्ष",
        sixMo: "/6 माह",
        threeMo: "/3 माह",
        month: "/माह",
        week: "/सप्ताह",
      },
      units: { day: "दिन", week: "सप्ताह", month: "महीना", year: "वर्ष" },
      tryFree: "{{count}} {{unit}} मुफ़्त आज़माएँ",
      mostPopular: "🏆 सबसे लोकप्रिय",
      hero: {
        title: "अपने बच्चे के लिए कहानियों की दुनिया खोलें",
        subtitle: "आपके नन्हे पाठक के लिए 50 से ज़्यादा रोमांच इंतज़ार में",
      },
      features: {
        stories: "50 से ज़्यादा कहानियों तक पहुँच",
        activities: "शैक्षिक गतिविधियाँ और मिनी-गेम",
      },
      choosePlan: "अपना प्लान चुनें",
      loadingPlans: "प्लान लोड हो रहे हैं...",
      loadError: "प्लान लोड नहीं हो सके। कृपया फिर कोशिश करें।",
      gateNotice: "हर खरीद पैरेंटल गेट से सुरक्षित है।",
      cta: "🎉 अभी शुरू करें!",
      ctaSub: "फिर {{price}} · कभी भी रद्द करें",
      restore: "खरीद बहाल करें",
      whyTitle: "परिवार Pedagogy क्यों चुनते हैं",
      trust: {
        safeTitle: "बच्चों के लिए सुरक्षित",
        safeText: "खरीद और लिंक पैरेंटल गेट से सुरक्षित हैं।",
        noAdsTitle: "कोई तृतीय-पक्ष विज्ञापन नहीं",
        noAdsText: "पढ़ने और सीखने के लिए एक शांत, ध्यान भटकाव-रहित जगह।",
        cancelTitle: "कभी भी रद्द करें",
        cancelText: "अपने अकाउंट सेटिंग्स में कभी भी अपना प्लान प्रबंधित करें।",
      },
      finePrint:
        "बिलिंग स्वतः होती है। आप अपने अकाउंट सेटिंग्स में कभी भी रद्द कर सकते हैं। सदस्यता लेकर, आप हमारी",
      finePrintAnd: "और",
      terms: "उपयोग की शर्तें (EULA)",
      privacy: "गोपनीयता नीति",
      alerts: {
        activeTitle: "🎉 सदस्यता सक्रिय!",
        activeBody: "आपकी कहानियाँ अनलॉक हो गईं। पढ़ने का आनंद लें!",
        activeCta: "चलिए!",
        errorTitle: "कुछ गड़बड़ हो गई",
        restoredTitle: "✅ खरीद बहाल हुई",
        restoredBody: "आपकी सदस्यता बहाल कर दी गई है।",
        restoredCta: "जारी रखें",
        restoreFailedTitle: "बहाली विफल",
        noSubTitle: "कोई सक्रिय सदस्यता नहीं",
        noSubBody: "इस अकाउंट से जुड़ी कोई पिछली खरीद नहीं मिली।",
      },
    },
  },

  ar: {
    onboarding: {
      next: "التالي",
      start: "هيا بنا 👍",
      slides: {
        welcome: {
          badge: "مرحبًا بك في Pedagogy",
          title: "قصص تُعلّم\nوتُمتع",
          description:
            "Pedagogy تطبيق قصص للأطفال بمحتوى تعليمي، مصمّم لتنمية الأطفال من 2 إلى 10 سنوات بطريقة مرحة وجذّابة.",
        },
        library: {
          badge: "مكتبة لا حدود لها",
          title: "مئات القصص\nلاستكشافها",
          description:
            "حكايات ومغامرات وعلوم والمزيد. محتوى جديد كل شهر، مع سرد صوتي ورسوم ملوّنة.",
        },
        learning: {
          badge: "تعلّم حقيقي",
          title: "تابع تقدّم\nطفلك",
          description:
            "اختبارات وإنجازات وتقارير قراءة للآباء. لم يكن التعليم يومًا بهذه المتعة وسهولة المتابعة.",
        },
      },
    },
    paywall: {
      period: {
        annual: "سنوي",
        sixMonth: "6 أشهر",
        threeMonth: "3 أشهر",
        twoMonth: "شهران",
        monthly: "شهري",
        weekly: "أسبوعي",
      },
      periodShort: {
        year: "/سنة",
        sixMo: "/6 أشهر",
        threeMo: "/3 أشهر",
        month: "/شهر",
        week: "/أسبوع",
      },
      units: { day: "يوم", week: "أسبوع", month: "شهر", year: "سنة" },
      tryFree: "تجربة مجانية لمدة {{count}} {{unit}}",
      mostPopular: "🏆 الأكثر شيوعًا",
      hero: {
        title: "افتح عالمًا من القصص لطفلك",
        subtitle: "أكثر من 50 مغامرة بانتظار قارئك الصغير",
      },
      features: {
        stories: "الوصول إلى أكثر من 50 قصة",
        activities: "أنشطة تعليمية وألعاب مصغّرة",
      },
      choosePlan: "اختر خطتك",
      loadingPlans: "جارٍ تحميل الخطط...",
      loadError: "تعذّر تحميل الخطط. يرجى المحاولة مرة أخرى.",
      gateNotice: "كل عملية شراء محمية ببوابة أبوية.",
      cta: "🎉 ابدأ الآن!",
      ctaSub: "ثم {{price}} · يمكنك الإلغاء في أي وقت",
      restore: "استعادة المشتريات",
      whyTitle: "لماذا تختار العائلات Pedagogy",
      trust: {
        safeTitle: "آمن للأطفال",
        safeText: "المشتريات والروابط محمية ببوابة أبوية.",
        noAdsTitle: "بلا إعلانات خارجية",
        noAdsText: "مساحة هادئة وخالية من التشتيت للقراءة والتعلّم.",
        cancelTitle: "الإلغاء في أي وقت",
        cancelText: "أدر خطتك في أي وقت من إعدادات حسابك.",
      },
      finePrint:
        "تتم الفوترة تلقائيًا. يمكنك الإلغاء في أي وقت من إعدادات حسابك. باشتراكك، فإنك توافق على",
      finePrintAnd: "و",
      terms: "شروط الاستخدام (EULA)",
      privacy: "سياسة الخصوصية",
      alerts: {
        activeTitle: "🎉 الاشتراك مُفعّل!",
        activeBody: "تم فتح قصصك. قراءة ممتعة!",
        activeCta: "هيا بنا!",
        errorTitle: "حدث خطأ ما",
        restoredTitle: "✅ تمت استعادة الشراء",
        restoredBody: "تمت استعادة اشتراكك.",
        restoredCta: "متابعة",
        restoreFailedTitle: "فشلت الاستعادة",
        noSubTitle: "لا يوجد اشتراك نشط",
        noSubBody: "لم نعثر على عملية شراء سابقة مرتبطة بهذا الحساب.",
      },
    },
  },
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const [lang, additions] of Object.entries(DATA)) {
  const file = join(LOCALES_DIR, `${lang}.json`);
  const json = JSON.parse(readFileSync(file, "utf8"));
  deepMerge(json, additions);
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`updated ${lang}.json`);
}
console.log("done");
