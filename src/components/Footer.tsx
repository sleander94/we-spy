const Footer = () => {
  return (
    <section id="footer">
      <img src={require('../assets/icons/android-chrome-192x192.png')} alt="" />
      <p>We Spy - 2022</p>
      <a href="https://github.com/sleander94" target="_blank" rel="noreferrer">
        <img
          src={require('../assets/icons/iconmonstr-github-1.svg').default}
          alt=""
        />
      </a>
    </section>
  );
};

export default Footer;
