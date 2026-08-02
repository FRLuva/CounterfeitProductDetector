import { Link } from "react-router-dom";
import "./ProjectPages.css";

function ProjectNav() {
  return (
    <nav className="project-nav">
      <Link to="/">Login / Register</Link>
      <Link to="/community-alert">Community Alert</Link>
      <Link to="/geo-verification">Geo Verification</Link>
      <Link to="/chain-trace">Chain Trace</Link>
      <Link to="/create-chain-record">Create Chain Record</Link>
      <Link to="/add-chain-event">Add Chain Event</Link>
    </nav>
  );
}

export default ProjectNav;