import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppContext';
import './SiteHeader.css';

function MiniRunnerGame({ onClose }: { onClose: () => void }) {
  const AREA_WIDTH = 340;
  const AREA_HEIGHT = 180;
  const GROUND_HEIGHT = 30;
  const RUNNER_SIZE = 22;
  const RUNNER_X = 42;

  type CakeKind = 'cupcake' | 'slice' | 'layer' | 'donut';
  type CakeObstacle = { kind: CakeKind; width: number; height: number };

  const nextCakeObstacle = (): CakeObstacle => {
    const options: CakeObstacle[] = [
      { kind: 'cupcake', width: 20, height: 24 },
      { kind: 'slice', width: 24, height: 20 },
      { kind: 'layer', width: 26, height: 26 },
      { kind: 'donut', width: 22, height: 22 },
    ];
    return options[Math.floor(Math.random() * options.length)];
  };

  const initialObstacle = nextCakeObstacle();

  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [runnerY, setRunnerY] = useState(AREA_HEIGHT - GROUND_HEIGHT - RUNNER_SIZE);
  const [velocity, setVelocity] = useState(0);
  const [obstacleX, setObstacleX] = useState(AREA_WIDTH + 40);
  const [obstacleKind, setObstacleKind] = useState<CakeKind>(initialObstacle.kind);
  const [obstacleWidth, setObstacleWidth] = useState(initialObstacle.width);
  const [obstacleHeight, setObstacleHeight] = useState(initialObstacle.height);
  const [showCrash, setShowCrash] = useState(false);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);

  const resetRound = () => {
    setScore(0);
    scoreRef.current = 0;
    setRunnerY(AREA_HEIGHT - GROUND_HEIGHT - RUNNER_SIZE);
    setVelocity(0);
    setObstacleX(AREA_WIDTH + 80);
    const fresh = nextCakeObstacle();
    setObstacleKind(fresh.kind);
    setObstacleWidth(fresh.width);
    setObstacleHeight(fresh.height);
    setShowCrash(false);
  };

  const startGame = () => {
    resetRound();
    setIsRunning(true);
  };

  const jump = () => {
    const groundY = AREA_HEIGHT - GROUND_HEIGHT - RUNNER_SIZE;
    if (!isRunning) {
      startGame();
      return;
    }
    if (runnerY >= groundY - 1) {
      setVelocity(-7.1);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const groundY = AREA_HEIGHT - GROUND_HEIGHT - RUNNER_SIZE;
    const tick = window.setInterval(() => {
      setVelocity((currentV) => {
        const nextVelocity = currentV + 0.55;
        setRunnerY((currentY) => {
          const nextY = currentY + nextVelocity;
          if (nextY > groundY) {
            return groundY;
          }
          return nextY;
        });
        return nextVelocity;
      });

      setObstacleX((currentX) => {
        const speed = 5 + Math.min(3, scoreRef.current / 20);
        let nextX = currentX - speed;
        if (nextX < -obstacleWidth) {
          const nextObstacle = nextCakeObstacle();
          nextX = AREA_WIDTH + Math.random() * 100;
          setObstacleKind(nextObstacle.kind);
          setObstacleWidth(nextObstacle.width);
          setObstacleHeight(nextObstacle.height);
          scoreRef.current += 1;
          setScore(scoreRef.current);
        }

        const runnerTop = runnerY;
        const runnerBottom = runnerY + RUNNER_SIZE;
        const obstacleY = AREA_HEIGHT - GROUND_HEIGHT - obstacleHeight;
        const obstacleLeft = nextX;
        const obstacleRight = nextX + obstacleWidth;
        const intersectsX = obstacleRight > RUNNER_X && obstacleLeft < RUNNER_X + RUNNER_SIZE;
        const intersectsY = runnerBottom > obstacleY && runnerTop < obstacleY + obstacleHeight;

        if (intersectsX && intersectsY) {
          setIsRunning(false);
          setShowCrash(true);
          if (scoreRef.current > bestRef.current) {
            bestRef.current = scoreRef.current;
            setBestScore(scoreRef.current);
          }
        }

        return nextX;
      });
    }, 28);

    return () => {
      window.clearInterval(tick);
    };
  }, [isRunning, runnerY, obstacleWidth, obstacleHeight]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="mini-game-overlay" onClick={onClose}>
      <div className="mini-game-modal" onClick={(event) => event.stopPropagation()}>
        <div className="mini-game-header">
          <h3>Sketch Dash</h3>
          <button type="button" className="button secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mini-game-help">Press Space or tap Jump. Hop over the bake sale cakes.</p>

        <div className="mini-game-arena" onClick={jump}>
          <div className="mini-game-sky" />
          <div className="mini-game-grid" />
          <div className="mini-game-horizon" />
          <div
            className="mini-game-runner"
            style={{ left: `${RUNNER_X}px`, top: `${runnerY}px`, width: `${RUNNER_SIZE}px`, height: `${RUNNER_SIZE}px` }}
          />
          <div
            className={`mini-game-obstacle mini-game-obstacle-${obstacleKind}`}
            style={{ left: `${obstacleX}px`, top: `${AREA_HEIGHT - GROUND_HEIGHT - obstacleHeight}px`, width: `${obstacleWidth}px`, height: `${obstacleHeight}px` }}
          />
          <div className="mini-game-ground" style={{ height: `${GROUND_HEIGHT}px` }} />
        </div>

        <div className="mini-game-footer">
          <p>Score: {score}</p>
          <p>Best: {bestScore}</p>
          <button type="button" className="button" onClick={isRunning ? jump : startGame}>
            {isRunning ? 'Jump' : showCrash ? 'Play again' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const { isStaff, isAdmin, logoutStaff } = useAppState();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [brandTapCount, setBrandTapCount] = useState(0);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const brandTapResetRef = useRef<number | null>(null);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await logoutStaff();
    navigate('/');
    closeMenu();
  };

  const handleBrandTap = () => {
    setBrandTapCount((count) => {
      const next = count + 1;
      if (next >= 10) {
        setShowMiniGame(true);
        return 0;
      }
      return next;
    });

    if (brandTapResetRef.current) {
      window.clearTimeout(brandTapResetRef.current);
    }
    brandTapResetRef.current = window.setTimeout(() => {
      setBrandTapCount(0);
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (brandTapResetRef.current) {
        window.clearTimeout(brandTapResetRef.current);
      }
    };
  }, []);

  return (
    <>
      <header className="site-header">
        <button
          type="button"
          className="brand brand-trigger"
          onClick={handleBrandTap}
          title="Tanfield Lea Community Centre"
        >
          Tanfield Lea Community Centre
        </button>
        <button
          type="button"
          className={`nav-toggle ${menuOpen ? 'is-open' : ''}`}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`site-controls ${menuOpen ? 'open' : ''}`}>
          <nav className="nav-links">
            <NavLink to="/" end onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/news" onClick={closeMenu}>
              News
            </NavLink>
            <NavLink to="/booking" onClick={closeMenu}>
              Booking requests
            </NavLink>
            <NavLink to="/about" onClick={closeMenu}>
              About
            </NavLink>
            {isStaff && (
              <>
                <span className="nav-divider" aria-hidden="true" />
                <span className="nav-group-label">Staff</span>
                <NavLink to="/staff/dashboard" className="nav-link-staff" onClick={closeMenu}>
                  Post news
                </NavLink>
                <NavLink to="/staff/requests" className="nav-link-staff" onClick={closeMenu}>
                  Requests
                </NavLink>
                <NavLink to="/staff/calendar" className="nav-link-staff" onClick={closeMenu}>
                  Calendar
                </NavLink>
              </>
            )}
          </nav>
          <div className="nav-actions">
            {isAdmin && (
              <NavLink to="/staff/admin" className="button admin-button" onClick={closeMenu}>
                Admin
              </NavLink>
            )}
            {!isStaff ? (
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  navigate('/staff');
                  closeMenu();
                }}
              >
                Staff login
              </button>
            ) : (
              <button type="button" className="button secondary" onClick={handleLogout}>
                Log out
              </button>
            )}
          </div>
        </div>
      </header>
      {showMiniGame && <MiniRunnerGame onClose={() => setShowMiniGame(false)} />}
    </>
  );
}

