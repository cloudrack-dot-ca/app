import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  // Handle plaintext passwords - TEMPORARY SOLUTION
  // This is for compatibility with existing accounts that might have plaintext passwords
  // First check if password is stored in plaintext format (not recommended!)
  if (!stored.includes(".")) {
    console.log("WARNING: Plaintext password detected, comparing directly");
    // If the password is stored in plaintext, check if it matches directly
    const match = supplied === stored;

    // Automatically upgrade to secure hash if plaintext password matches
    if (match) {
      console.log("Password matches plaintext - password should be upgraded");
    }

    return match;
  }

  // Normal case - password is stored with proper hash format
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid password hash or salt format");
      return false;
    }

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "development-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false);
      }

      // Check if account is suspended
      if (user.isSuspended) {
        return done(null, false, { message: 'Account is suspended. Please contact support.' });
      }

      const passwordMatches = await comparePasswords(password, user.password);

      if (!passwordMatches) {
        return done(null, false);
      }

      // Automatic password upgrade if plain text password was detected
      if (!user.password.includes(".")) {
        try {
          console.log(`Upgrading password hash for user ${user.id}`);
          const hashedPassword = await hashPassword(password);
          await storage.updateUser(user.id, { password: hashedPassword });

          // Get the updated user
          const updatedUser = await storage.getUser(user.id);
          if (updatedUser) {
            return done(null, updatedUser);
          }
        } catch (error) {
          console.error("Error upgrading password hash:", error);
          // Continue login even if upgrade fails
        }
      }

      return done(null, user);
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }

      // Check if account has been suspended since last login
      if (user.isSuspended) {
        return done(null, false);
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// Modify the requireAuth function to provide better debugging for GitHub OAuth
export function requireAuth(req, res, next) {
  // Check if user is authenticated
  if (!req.user) {
    // Special case for GitHub OAuth callback - make it more robust
    if (req.url.includes('/github') || req.url.includes('/auth/github')) {
      console.log('⚠️ [Auth] GitHub-related request without authentication. Attempting to continue.');

      // If this is the GitHub callback, we'll let it proceed to show a more helpful error
      if (req.url.includes('/callback')) {
        console.log('⚠️ [Auth] GitHub callback without user session, will show instructions');
        return next();
      }

      return res.status(401).json({
        error: 'Authentication required for GitHub integration',
        message: 'Please login first before connecting to GitHub'
      });
    }

    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

interface AuthenticatedRequest extends Request {
  user?: {
    isAdmin: boolean;
    [key: string]: any;
  };
}

/**
 * Middleware to check if the user has admin privileges
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }

  // User is an admin, proceed to the next middleware/route handler
  next();
};

// You might also want to add a general authentication middleware
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // This is a placeholder. Implement your actual authentication logic here.
  // For example, verify JWT token, session, etc.

  // If authentication fails
  // return res.status(401).json({ error: 'Authentication failed' });

  // If authentication succeeds, set the user object and proceed
  // req.user = { id: 'user_id', isAdmin: true };

  next();
};
