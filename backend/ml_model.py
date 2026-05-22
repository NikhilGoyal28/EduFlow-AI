"""
LeadConversionPredictor — RandomForest ML engine
Predicts the probability (0–100%) that a lead will convert to an enrolled student.
Features: source (one-hot), messages count, days_inactive, funnel_status (ordinal)
"""

import json
import os
import numpy as np
from datetime import datetime

# Lazy imports so the backend still starts even if scikit-learn not yet installed
try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import OneHotEncoder
    from sklearn.pipeline import Pipeline
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import accuracy_score
    from sklearn.model_selection import train_test_split
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("⚠️  scikit-learn not found. Install it: pip install scikit-learn")


# ---------------------------------------------------------------------------
# Synthetic training dataset — realistic lead behaviour patterns for education CRM
# ---------------------------------------------------------------------------
SEED_TRAINING_DATA = [
    # (source, messages, days_inactive, status_ord, converted)
    # WhatsApp — high-intent channel
    ("WhatsApp", 5, 0, 3, True),
    ("WhatsApp", 4, 1, 2, True),
    ("WhatsApp", 3, 2, 2, True),
    ("WhatsApp", 6, 0, 3, True),
    ("WhatsApp", 2, 5, 1, False),
    ("WhatsApp", 1, 10, 0, False),
    ("WhatsApp", 3, 0, 3, True),
    ("WhatsApp", 2, 3, 1, False),
    ("WhatsApp", 7, 0, 3, True),
    ("WhatsApp", 1, 14, 0, False),
    ("WhatsApp", 4, 0, 2, True),
    ("WhatsApp", 2, 8, 0, False),
    # Facebook — medium intent
    ("Facebook", 3, 1, 2, True),
    ("Facebook", 2, 4, 1, False),
    ("Facebook", 4, 0, 3, True),
    ("Facebook", 1, 7, 0, False),
    ("Facebook", 0, 12, 0, False),
    ("Facebook", 3, 2, 2, True),
    ("Facebook", 1, 9, 0, False),
    ("Facebook", 5, 0, 3, True),
    ("Facebook", 2, 5, 1, False),
    ("Facebook", 0, 15, 0, False),
    ("Facebook", 4, 1, 3, True),
    ("Facebook", 1, 6, 0, False),
    # Website — moderate intent
    ("Website", 2, 2, 2, True),
    ("Website", 1, 5, 1, False),
    ("Website", 3, 0, 3, True),
    ("Website", 0, 8, 0, False),
    ("Website", 2, 1, 2, True),
    ("Website", 1, 10, 0, False),
    ("Website", 4, 0, 3, True),
    ("Website", 0, 14, 0, False),
    ("Website", 2, 3, 1, False),
    ("Website", 3, 1, 2, True),
    ("Website", 1, 7, 0, False),
    ("Website", 5, 0, 3, True),
]

STATUS_ORDINAL = {
    "New": 0,
    "Contacted": 1,
    "Interested": 2,
    "Enrolled": 3,
}


class LeadConversionPredictor:
    def __init__(self):
        self.model = None
        self.trained = False
        self.accuracy = 0.0
        self.feature_importances = {}

        if not SKLEARN_AVAILABLE:
            return

        self._build_pipeline()
        # Pre-train on seed data immediately so the model is ready from Day 1
        self.auto_train(extra_leads=[])
        print(f"✅  ML Model ready — Accuracy: {self.accuracy:.1%}  |  Top Feature: {self._top_feature()}")

    def _build_pipeline(self):
        categorical = ["source"]
        numerical = ["messages", "days_inactive", "status_ord"]

        preprocessor = ColumnTransformer(transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("num", StandardScaler(), numerical),
        ])

        self.pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(
                n_estimators=200,
                max_depth=6,
                min_samples_split=2,
                random_state=42,
                class_weight="balanced"
            ))
        ])

    def _prepare_row(self, lead):
        """Convert a lead dict to a feature row."""
        source = lead.get("source", "Website")
        messages = int(lead.get("messages", 0))
        days_inactive = int(lead.get("days_inactive", 3))
        status_ord = STATUS_ORDINAL.get(lead.get("status", "New"), 0)
        return {
            "source": source,
            "messages": messages,
            "days_inactive": days_inactive,
            "status_ord": status_ord,
        }

    def auto_train(self, extra_leads=None):
        """Train the model. Uses seed data + any real DB leads provided."""
        if not SKLEARN_AVAILABLE:
            return

        rows = []
        labels = []

        # Seed synthetic data
        for (src, msgs, inactive, status_ord, converted) in SEED_TRAINING_DATA:
            rows.append({"source": src, "messages": msgs, "days_inactive": inactive, "status_ord": status_ord})
            labels.append(1 if converted else 0)

        # Real DB data supplements seed data
        if extra_leads:
            for lead in extra_leads:
                row = self._prepare_row(lead)
                converted = lead.get("converted", False) or lead.get("status") == "Enrolled"
                rows.append(row)
                labels.append(1 if converted else 0)

        import pandas as pd
        X = pd.DataFrame(rows)
        y = np.array(labels)

        # Train / validation split (only if enough data)
        if len(X) >= 10:
            X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
            self.pipeline.fit(X_train, y_train)
            y_pred = self.pipeline.predict(X_val)
            self.accuracy = accuracy_score(y_val, y_pred)
        else:
            self.pipeline.fit(X, y)
            self.accuracy = 1.0

        self.trained = True

        # Capture feature importances
        try:
            clf = self.pipeline.named_steps["classifier"]
            preprocessor = self.pipeline.named_steps["preprocessor"]
            feature_names = (
                list(preprocessor.named_transformers_["cat"].get_feature_names_out(["source"]))
                + ["messages", "days_inactive", "status_ord"]
            )
            importances = clf.feature_importances_
            self.feature_importances = dict(sorted(
                zip(feature_names, importances),
                key=lambda x: x[1], reverse=True
            ))
        except Exception:
            self.feature_importances = {}

    def predict_propensity(self, lead: dict) -> int:
        """
        Returns an integer 0–100 representing the probability of conversion.
        Falls back to a rule-based heuristic if scikit-learn is unavailable.
        """
        if not SKLEARN_AVAILABLE or not self.trained:
            return self._heuristic_score(lead)

        try:
            import pandas as pd
            row = self._prepare_row(lead)
            X = pd.DataFrame([row])
            prob = self.pipeline.predict_proba(X)[0][1]  # Probability of class=1 (converted)
            return round(prob * 100)
        except Exception as e:
            print(f"⚠️  ML prediction error: {e}")
            return self._heuristic_score(lead)

    def _heuristic_score(self, lead) -> int:
        """Fallback rule-based score if model unavailable."""
        score = 40
        if lead.get("status") == "Enrolled":
            return 100
        score += min(int(lead.get("messages", 0)) * 6, 25)
        if lead.get("source") == "WhatsApp":
            score += 15
        elif lead.get("source") == "Website":
            score += 8
        score -= min(int(lead.get("days_inactive", 0)) * 5, 30)
        status_bonus = {"Interested": 20, "Contacted": 5, "New": -10}
        score += status_bonus.get(lead.get("status", "New"), 0)
        return max(0, min(100, score))

    def _top_feature(self) -> str:
        if self.feature_importances:
            return list(self.feature_importances.keys())[0]
        return "messages"

    def get_insights(self, leads: list) -> list:
        """
        Returns data-driven, ML-generated insight strings based on actual feature
        importances and real lead data patterns.
        """
        if not leads:
            return ["📊 No lead data yet. Add leads to unlock AI insights."]

        insights = []
        total = len(leads)
        enrolled = sum(1 for l in leads if l.get("status") == "Enrolled")
        at_risk = [l for l in leads if l.get("ml_score", 50) < 35 and l.get("status") != "Enrolled"]
        high_intent = [l for l in leads if l.get("ml_score", 0) >= 70 and l.get("status") != "Enrolled"]

        # Model accuracy insight
        if self.trained and self.accuracy > 0:
            insights.append({
                "icon": "🧠",
                "title": f"Model Confidence: {self.accuracy:.0%}",
                "desc": f"Trained on {len(SEED_TRAINING_DATA) + len(leads)} data points. Top predictive signal: '{self._top_feature().replace('source_', 'Source: ')}' drives conversion most strongly.",
                "type": "positive"
            })

        # High-intent leads
        if high_intent:
            names = ", ".join(l["name"] for l in high_intent[:2])
            insights.append({
                "icon": "🔥",
                "title": f"{len(high_intent)} High-Propensity Lead{'s' if len(high_intent) > 1 else ''}",
                "desc": f"{names}{'...' if len(high_intent) > 2 else ''} score 70%+ for conversion. Prioritise immediate outreach — every hour counts.",
                "type": "positive"
            })
        
        # At-risk leads
        if at_risk:
            insights.append({
                "icon": "⚠️",
                "title": f"{len(at_risk)} Lead{'s' if len(at_risk) > 1 else ''} Predicted to Churn",
                "desc": f"ML model flags {len(at_risk)} leads with <35% propensity score. Auto-ping or reassign to prevent funnel leakage.",
                "type": "warning"
            })

        # Source performance
        by_source = {}
        for lead in leads:
            src = lead.get("source", "Unknown")
            if src not in by_source:
                by_source[src] = {"total": 0, "converted": 0}
            by_source[src]["total"] += 1
            if lead.get("converted") or lead.get("status") == "Enrolled":
                by_source[src]["converted"] += 1

        best_src = max(by_source.items(), key=lambda x: x[1]["converted"] / max(x[1]["total"], 1), default=None)
        if best_src:
            conv_pct = round(best_src[1]["converted"] / best_src[1]["total"] * 100)
            insights.append({
                "icon": "📊",
                "title": f"{best_src[0]} Leads Converting Best",
                "desc": f"{best_src[0]} leads show a {conv_pct}% real conversion rate in your pipeline. Recommend increasing {best_src[0]} budget allocation.",
                "type": "info"
            })

        return insights if insights else [{
            "icon": "✅",
            "title": "All Pipelines Healthy",
            "desc": "No immediate churn risk detected. ML model monitoring all leads in real-time.",
            "type": "positive"
        }]
