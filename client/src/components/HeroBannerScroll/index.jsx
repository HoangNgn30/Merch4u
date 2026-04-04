import React, { useRef } from 'react';
import './style.css';
import gsap from "gsap";
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import skyImg from './img/bigbang.webp';
import windowImg from './img/window.png';

gsap.registerPlugin(ScrollTrigger);

const HeroBannerScroll = () => {
    const mainRef = useRef(null);

    useGSAP(() => {
        const sky = mainRef.current.querySelector(".sky-container");
        const windowBox = mainRef.current.querySelector(".window-container");
        const header = mainRef.current.querySelector(".hero-header");
        const col1 = mainRef.current.querySelector(".col1hero");
        const col2 = mainRef.current.querySelector(".col2hero");
        const copy = mainRef.current.querySelector(".hero-copy");

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: mainRef.current,
                start: "top top",
                end: "+=200%", 
                pin: true,
                scrub: 1, 
                anticipatePin: 1,
            }
        });

        tl.to(windowBox, { scale: 20, ease: "power2.inOut" }, 0)
            .to(header, { 
                scale: 8, 
                opacity: 0, 
                ease: "power2.inOut" 
            }, 0)
            .to(col1, { xPercent: -200, opacity: 0, ease: "power2.inOut" }, 0)
            .to(col2, { xPercent: 200, opacity: 0, ease: "power2.inOut" }, 0)
            .to(sky, { yPercent: -35, ease: "none" }, 0) 
            .to(copy, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2");

        }, { scope: mainRef });

    return (
        <section className='hero' ref={mainRef}>
            <div className='sky-container'><img src={skyImg} alt="Sky" /></div>
            <div className='window-container'><img src={windowImg} alt="Window" /></div>
            <div className='hero-header'>
                <div className='col1hero uppercase'><h1>Define <br /> your fandom</h1></div>
                <div className='col2hero uppercase'><h1>Own <br /> the moment</h1></div>
            </div>
            <div className='hero-copy uppercase'>
                <h1>your wallet - your choice</h1>
            </div>
        </section>
    );
};

export default HeroBannerScroll;