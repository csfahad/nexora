import { Link } from "@tanstack/react-router";

export const LegalLinks = () => (
    <nav aria-label="Legal" className="legal-links">
        <Link to="/terms">Terms of Service</Link>
        <Link to="/privacy">Privacy Policy</Link>
    </nav>
);
