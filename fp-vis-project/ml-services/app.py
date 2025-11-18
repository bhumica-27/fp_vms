from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Simple anomaly detection using statistical methods
class SimpleAnomalyDetector:
    def __init__(self):
        self.visit_history = {}
    
    def calculate_score(self, visitor_id, purpose, time_of_day):
        score = 0.0
        
        # Time-based anomaly (outside 8 AM - 6 PM)
        if time_of_day < 8 or time_of_day > 18:
            score += 0.3
        
        # Frequency check
        if visitor_id in self.visit_history:
            visits_today = len([v for v in self.visit_history[visitor_id] 
                              if (datetime.now() - v['time']).days == 0])
            if visits_today > 3:
                score += 0.4
        else:
            self.visit_history[visitor_id] = []
        
        # Record visit
        self.visit_history[visitor_id].append({
            'time': datetime.now(),
            'purpose': purpose
        })
        
        return min(score, 1.0)

detector = SimpleAnomalyDetector()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'ML Service'})

@app.route('/api/ml/anomaly-score', methods=['POST'])
def calculate_anomaly():
    data = request.json
    visitor_id = data.get('visitorId')
    purpose = data.get('purpose')
    time_of_day = datetime.now().hour
    
    score = detector.calculate_score(visitor_id, purpose, time_of_day)
    
    return jsonify({
        'visitorId': visitor_id,
        'anomalyScore': score,
        'risk': 'high' if score > 0.7 else 'medium' if score > 0.4 else 'low'
    })

if __name__ == '__main__':
    print("🤖 ML Service starting on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=True)
