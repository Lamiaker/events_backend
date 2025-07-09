require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require('./routes/admin.routes');
const app = express();

// 1. Middleware de sécurité de base
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", process.env.CLIENT_URL],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", process.env.CLIENT_URL],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);

// 2. Protection contre les attaques HTTP Parameter Pollution
app.use(hpp());

// 3. Limitation de taux avec configuration améliorée
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: {
    status: 429,
    error: "Too many requests",
    message:
      "Vous avez dépassé le nombre de requêtes autorisées. Veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Compter aussi les requêtes réussies
  keyGenerator: (req) => {
    return req.headers["x-forwarded-for"] || req.ip; // Prend en compte le proxy
  },
});

// Appliquer à toutes les routes
app.use(limiter);

// 4. Configuration CORS sécurisée
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "https://votredomaine.com", // Ajoutez d'autres domaines si nécessaire
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// 5. Middleware pour analyser le corps des requêtes
app.use(
  express.json({
    limit: "10kb", // Limite la taille du corps à 10kb
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf.toString()); // Vérifie que le JSON est valide
      } catch (e) {
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
// 6. Protection contre les injections NoSQL et nettoyage des données
// app.use(
//   mongoSanitize({
//     replaceWith: "_",
//     onSanitize: ({ req, key }) => {
//       console.warn(`Sanitized ${key} in request ${req.method} ${req.path}`);
//     },
//   })
// );
// 7. Headers de sécurité supplémentaires
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Expect-CT", "max-age=0");
  next();
});
app.use(express.json());
// 8. Routes


// Après les autres middlewares
app.use('/api/admin', adminRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);

// 9. Route de santé pour les checks
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// 10. Gestion des erreurs améliorée
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Ne pas divulguer les détails de l'erreur en production
  const errorResponse = {
    message: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  };

  res.status(err.status || 500).json(errorResponse);
});

// 11. Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
