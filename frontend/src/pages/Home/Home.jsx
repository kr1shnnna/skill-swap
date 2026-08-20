import './Home.css'

const Home = () => {
  return (
   
    <main className='home'>

        <section className='hero'>

            <div className='hero-content'>

                <p className='hero-tag'>LEARN • TEACH • CONNECT</p>

                <h1>
                    Exchange Skills.
                    <br />
                    <span>Grow Together.</span>
                </h1>

                <p className='hero-description'>
                    SkillSwap connects students who want to learn with students
            who have the skills to teach.
                </p>

                <div className='hero-buttons'>
                    <button className='primary-btn'>Find Your Match</button>
                    <button className='secondary-btn'>How It Works</button>

                </div>

                

            </div>

        </section>


    </main>
  )
}

export default Home