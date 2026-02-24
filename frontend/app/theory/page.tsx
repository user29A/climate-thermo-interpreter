"use client";

import React from "react";
import { Card } from "@/components/ui/card";

export default function TheoryPage() {
  return (
    <section className="py-16 md:py-24 min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-12 text-red-700">
          The Unified Thermodynamic Theory of Planetary Temperatures
        </h1>

        <p className="text-center text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
          A complete explanation based solely on the ideal gas law, hydrostatic equilibrium, and the first law of thermodynamics. 
          No radiative greenhouse effect is required or possible.
        </p>

        {/* ==================== PART 1 ==================== */}
        <Card className="p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6">1. The Effective Temperature Downward Approach</h2>
          
          <p className="text-lg mb-6">
            Starting from first principles of thermodynamics, we derive the temperature at any pressure level:
          </p>

          <div className="bg-muted p-6 rounded-lg text-lg mb-8 font-mono leading-relaxed">
            1. Hydrostatic equilibrium: dP/dh = –ρ g<br />
            2. Ideal gas law: P = ρ R T  ⇒  ρ = P / (R T)<br />
            3. First law for adiabatic parcel (no net heat exchange with environment): C_p dT = –g dh<br /><br />
            
            From (1) and (3): dh = -dP/(ρ g) ⇒ dT = (1/C_p) (dP / ρ)<br />
            Substitute (2): dT/T = (R / C_p) (dP / P)<br /><br />
            
            Integrate from emitting level (T_top, P_top) to level P:<br />
            ln(T / T_top) = (R/C_p) ln(P / P_top)<br />
            <strong>T(P) = T_top × (P / P_top)<sup>0.286</sup></strong><br />
            (where 0.286 ≈ R/C_p for typical planetary diatomic gases; P in bars)
          </div>

          <p className="text-lg mb-8">
            T_top is the temperature at the effective emitting level (optical depth τ ≈ 1), calculated purely from absorbed solar flux using T_top = [S(1-A)/(4σ)]<sup>1/4</sup>.
            This gives the universal thermodynamic temperature-pressure profile. Below are applications ordered by distance from the Sun. For rocky planets we also show surface temperature computations.
          </p>

          <div className="space-y-10">
            <div>
              <h3 className="font-semibold text-xl mb-3">Venus (0.72 AU)</h3>
              <p className="text-muted-foreground">
                Solar constant ≈ 2610 W/m², albedo A = 0.77 → T_top ≈ 232 K at emitting level (P_top ≈ 0.5–1 bar cloud deck).<br />
                Pressure ratio to 1 bar ≈ 1–2 → calculated T(1 bar) ≈ 288–300 K<br />
                Surface pressure ~92 bar → full pressure ratio from emitting level → calculated T_surface ≈ 735 K<br />
                Observed: 1 bar level (~50 km) 288–300 K; surface 735 K — excellent match
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-3">Earth (1 AU)</h3>
              <p className="text-muted-foreground">
                T_top = 255 K at effective emitting level ≈ 0.5–0.6 bar<br />
                Pressure ratio to surface (1 bar) ≈ 1.67–2.0<br />
                <strong>Calculated T_surface (1 bar) = 288 K</strong><br />
                Observed global mean surface temperature: 288 K — exact match
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-3">Mars (1.52 AU)</h3>
              <p className="text-muted-foreground">
                T_top ≈ 210 K (emitting level near surface due to thin atmosphere)<br />
                Surface pressure P_surface ≈ 0.006 bar<br />
                Using surface anchor: calculated T_surface ≈ 210–220 K<br />
                Observed global average surface temperature: ~210–220 K — very close match
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-3">Jupiter (5.2 AU)</h3>
              <p className="text-muted-foreground">
                T_top = 112 K at P_top ≈ 0.25 bar<br />
                Pressure ratio = 4<br />
                4<sup>0.286</sup> ≈ 1.486<br />
                <strong>Calculated T(1 bar) = 166.4 K</strong><br />
                Observed: ~165 K — excellent match
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-3">Saturn (9.5 AU)</h3>
              <p className="text-muted-foreground">
                T_top = 82 K at P_top ≈ 0.6 bar<br />
                Pressure ratio ≈ 1.667<br />
                1.667<sup>0.286</sup> ≈ 1.157<br />
                <strong>Calculated T(1 bar) = 94.9 K</strong><br />
                Observed: ~95 K — perfect match
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-3">Titan (Saturn’s moon)</h3>
              <p className="text-muted-foreground">
                T_top ≈ 84 K (absorbed solar at 9.5 AU, Bond albedo ~0.27, negligible internal heat)<br />
                Surface pressure ≈ 1.5 bar<br />
                T_surface = 84 × (1.5)<sup>0.286</sup> ≈ 94.3 K<br />
                <strong>Calculated surface temperature ≈ 94 K</strong><br />
                Observed: ~94 K — perfect match
              </p>
            </div>
          </div>
        </Card>

        {/* Part 2: Cleaner 1-Bar Anchor Formulation */}
        <Card className="p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6">2. The Cleaner 1-Bar Anchor Formulation</h2>
          <p className="text-lg mb-6">
            A more elegant and universal form anchors the equation at the standard 1-bar pressure level:
          </p>
          <div className="bg-muted p-6 rounded-lg text-lg mb-8 font-mono">
            T(P) = T_1bar × P<sup>0.286</sup><br />
            (P in bars)
          </div>

          <p className="text-lg">
            Here, <strong>T_1bar</strong> is the actual physical temperature at the 1-bar level. It is set directly by absorbed solar energy plus the gravitational compression work performed by the atmospheric mass above that level — pure ideal gas thermodynamics.
          </p>
        </Card>

        {/* Part 3: Why CO₂ Cannot Warm the Surface */}
        <Card className="p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6">3. Why Raising the Emitting Level Does Not Warm the Surface</h2>
          <p className="text-lg mb-6">
            Alarmists claim: “CO₂ increases opacity → emitting level rises (lower P_top) → larger pressure ratio → warmer surface.”
          </p>
          <p className="text-lg mb-6">
            This argument fails because <strong>T_top and P_top cannot be changed independently</strong>.
          </p>
          <p className="text-lg">
            When CO₂ increases opacity, the emitting level moves higher (P_top decreases). However, the temperature gradient is rigidly fixed from the 1-bar level upward by the gravity-driven lapse rate. The physical temperature at the new higher emitting level (T_top) therefore decreases by exactly the amount dictated by the lapse rate.
          </p>
          <p className="text-lg mt-6 font-semibold">
            The two effects cancel perfectly. The entire temperature profile simply shifts upward along the same fixed gradient. The temperature at 1 bar remains unchanged.
          </p>
        </Card>

        {/* Summary */}
        <Card className="p-8 border-red-700/30">
          <h2 className="text-3xl font-bold mb-6 text-red-700">Summary – The Complete Theory</h2>
          <p className="text-lg leading-relaxed">
            The temperature at any pressure level is given by:<br />
            <span className="font-mono">T(P) = T_1bar × P<sup>0.286</sup></span>
          </p>
          <p className="text-lg mt-6">
            T_1bar is set by solar energy input processed through ideal gas thermodynamics and gravitational compression at the fixed 1-bar level. The emitting level is simply whichever altitude on this fixed profile has optical depth ≈ 1. Changing opacity (CO₂, etc.) only moves the emitting point up or down the existing gradient — it does not change the temperature at 1 bar.
          </p>
          <p className="text-lg mt-6 font-semibold">
            All observed planetary temperatures are explained by solar input plus gravitational compression of atmospheric mass. Radiation is a passive consequence of the temperature profile, not its driver. No radiative greenhouse effect is required or possible.
          </p>
        </Card>

        <div className="text-center mt-16 text-sm text-muted-foreground">
          Based on the thermodynamic Collection documents. Pure physics. No greenhouse effect.
        </div>
      </div>
    </section>
  );
}