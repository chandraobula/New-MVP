import React from "react";
import Button from "./Buttons";
import "../styles/variables.css";
import "./Header.css";
<<<<<<< HEAD
import "../styles/mixins.css";

=======
import Logo from "../assets/images/Logo_New.svg"
>>>>>>> 82da6b78bbacdf5d7a64553dae24f76d48d32906
const Header = () => {
  return (
    <div className="Search-Nav">
      <div className="Search-Nav-Items">
        <a href="/">
          <img
            href="/"
            className="Search-nav-logo"
            src={Logo}
            alt="Infer logo"
          ></img>
        </a>
        <section className="Search-nav-login">
          {/* <Button text="SignUp" className="signup-btn" /> */}
          <Button text="Login" className="login-btn" />
        </section>
      </div>
    </div>
  );
};

export default Header;
