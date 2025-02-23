import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/footer.css';
import instagram from '../css/images/instagram.png';
import linkedin from '../css/images/linkedin.png';
import twitter from '../css/images/twitter.png';
import contact from '../css/images/contact.png';
import { useNotification } from "../context/NotificationContext";

const Footer = ( {selectedType} ) => {
    const { addNotification } = useNotification();
    const navigate = useNavigate();

    return (
      <div className={selectedType === 'Snow Removal' ? 'footer-blue' : 'footer'}>
          <div className="footer-container">
              <img src={instagram} className="social-icon" onClick={() => addNotification("Coming soon!")}/>
              <img src={linkedin} className="social-icon" onClick={() => window.open("https://www.linkedin.com/in/andrew-larock-363b66319/", "_blank")}/>
              <img src={twitter} className="social-icon" onClick={() => addNotification("Coming soon!")} />
              <div className="footer-header-text">In a Pinch</div>
              <div className="footer-subheader-text">Proof of concept application connecting users to on-demand residential landscaping services and allowing them to offer their skills locally.</div>
              <div className="contact-container">
                  <img src={contact} className="contact-icon" />
                  <div className="contact-text">a.larock1@outlook.com</div>
              </div>
              <div className="tab-text" onClick={() => addNotification("Coming soon!")}>About Us</div>
              <div className="tab-text" onClick={() => addNotification("Coming soon!")}>Help Center</div>
              <div className="tab-text" onClick={() => navigate("/apply")}>Become a Provider</div>

          </div>
      </div>
    );
};

export default Footer;