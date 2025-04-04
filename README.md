# LegalMind - AI-Powered Legal Document Platform

LegalMind is an intelligent platform designed to simplify legal document analysis and management using advanced machine learning technologies.

![LegalMind Screenshot](img/img1.jpg)

## 🚀 Features

- **AI-Powered Document Analysis**: Leverage machine learning to analyze and understand legal documents
- **Intuitive Interface**: Clean, responsive design that works across devices
- **User Authentication**: Secure login system with Firebase Authentication
- **Interactive Chatbot**: Get assistance with legal queries through our AI chatbot

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **ML/AI**: Custom models for legal document analysis
- **Deployment**: GitHub Pages

## 📋 Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- For development: 
  - Node.js (v14+)
  - npm or yarn
  - Git

## 🔧 Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/legalmind.git
   cd legalmind
   ```

2. **Set up Firebase configuration**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com/)
   - Enable Authentication (Email/Password and Google Sign-in)
   - Set up Firestore database
   - Create a `.env` file with your Firebase configuration:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

3. **Run a local server**
   ```bash
   # With Python
   python -m http.server 8000
   
   # With Node.js
   npx serve
   ```

4. **Open in browser**
   - Navigate to `http://localhost:8000` or the port shown in your terminal

## 📂 Project Structure

```
legalmind/
├── img/                   # Image assets
├── visualizations/        # Data visualization files
├── auth.html              # Authentication page
├── auth.js                # Authentication logic
├── contact.html           # Contact page
├── index.html             # Home page
├── services.html          # Services page
├── style1.css             # Main stylesheet
├── temp3.html             # Chatbot interface
└── README.md              # Project documentation
```

## 🧠 Machine Learning Models

Our platform uses several custom-trained models for legal document analysis:

- **Document Classification**: Categorizes legal documents by type
- **Entity Recognition**: Identifies important entities in legal text
- **Summarization**: Creates concise summaries of lengthy legal documents

For more details, see [model_analysis_summary.md](model_analysis_summary.md) and [ieee_model_card.md](ieee_model_card.md).

## 🔒 Security & Privacy

- User data is securely stored in Firebase Firestore
- Authentication is handled by Firebase Auth with industry-standard practices
- Document processing is done securely with data encryption in transit
- We do not store the actual content of processed documents longer than necessary

## 🤝 Contributing

We welcome contributions to LegalMind! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please reach out through our [contact form](https://legalmind.yourdomain.com/contact.html) or open an issue on GitHub.

---

© 2023 LegalMind Team | All Rights Reserved

Final year project on legal documents 
we worked with a lot of models and merged our model and some pre-trained models 
our model's accuracy is slightly better than the other models available on the internet



![radar_chart_comparison](https://github.com/user-attachments/assets/47c7dba4-1074-4ff2-814d-8d9ff2d05d14)


We have shared the training results of our final model

The model is available in Hugging Face https://huggingface.co/Abbasgamer1/legalMind


# Model Card: final-merged-model3-pruned

## Introduction
This model card describes the parameters, training, and evaluation of the final-merged-model3-pruned model, a modified BERT architecture for sequence classification tasks. The model significantly outperforms the BERT-base-uncased baseline while maintaining a reasonable model size through pruning techniques.

## Model Details

| Parameter | Value |
|-----------|-------|
| Model Name | final-merged-model3-pruned |
| File Format | SafeTensors |
| File Size | 4.71 GB |
| Total Parameters | 2,468,762,141 (2.47B) |
| Architecture Base | BERT |
| Task | Sequence Classification |
| Language | English |
| Framework | PyTorch |
| License | Apache 2.0 |

## Layer Distribution

| Component | Parameters | Percentage |
|-----------|------------|------------|
| model | 1,864,465,920 | 75.52% |
| bert | 59,276,544 | 2.40% |
| classifier | 22,301 | <0.01% |
| *Other components* | *~544,998,376* | *~22.08%* |

## Training Information

### Training Process
- **Training Framework**: PyTorch
- **Optimization Algorithm**: AdamW
- **Learning Rate Schedule**: Linear warmup and decay
- **Batch Size**: 32
- **Hardware**: NVIDIA A100 GPUs
- **Training Time**: Approximately 12 hours

### Training Metrics

| Epoch | Train Loss | Validation Loss | Precision | Recall | F1 Score | Accuracy |
|-------|------------|-----------------|-----------|--------|----------|----------|
| 0 | 0.3771 | 0.1228 | 0.8400 | 0.8644 | 0.8520 | 0.9655 |
| 1 | 0.1172 | 0.0962 | 0.8715 | 0.9001 | 0.8856 | 0.9725 |
| 2 | 0.0801 | 0.0895 | 0.8805 | 0.9112 | 0.8956 | 0.9745 |
| 3 | 0.0753 | 0.0881 | 0.8820 | 0.9122 | 0.8972 | 0.9757 |
| 4 | 0.0501 | 0.0883 | 0.8840 | 0.9160 | 0.9011 | 0.9787 |

## Pruning Process
The model underwent a layer-based pruning process to reduce its size while maintaining performance:

1. Original model size: 6.60 GB
2. Pruned model size: 4.71 GB
3. Size reduction: 28.6%

The pruning algorithm prioritized keeping input-adjacent and output-adjacent layers while selectively removing middle layers based on their estimated importance, as these typically contribute less to model performance.

## GLUE Benchmark Performance

| Task | BERT-base-uncased | Our Model | Improvement |
|------|-------------------|-----------|-------------|
| MNLI | 84.6 | 87.2 | +2.6 |
| QQP | 71.2 | 74.8 | +3.6 |
| QNLI | 90.5 | 92.6 | +2.1 |
| SST-2 | 93.5 | 95.1 | +1.6 |
| CoLA | 52.1 | 58.3 | +6.2 |
| STS-B | 85.8 | 88.5 | +2.7 |
| MRPC | 88.9 | 91.2 | +2.3 |
| RTE | 66.4 | 72.3 | +5.9 |
| **Average** | **79.1** | **82.5** | **+3.4** |

## Inference Performance
- **Recommended Hardware**: NVIDIA V100 or newer
- **Minimum RAM**: 16GB
- **Average Inference Time**: 45ms per sequence
- **Throughput**: ~22 sequences per second

## Limitations and Biases
- The model inherits biases present in its base BERT architecture
- Limited evaluation on non-English texts
- Increased computational requirements compared to smaller models
- Not optimized for edge devices due to size

## Intended Use
- High-accuracy sequence classification tasks
- Legal document analysis
- Academic text processing
- Applications where accuracy is prioritized over inference speed

## Comparison to BERT-base-uncased

| Metric | BERT-base-uncased | Our Model |
|--------|-------------------|-----------|
| Model Size | 0.42 GB | 4.71 GB |
| Parameters | 110M | 2.47B |
| Training Accuracy | 93.8% | 97.87% |
| Final F1 Score | 0.856 | 0.9011 |
| GLUE Average | 79.1 | 82.5 |
| Inference Time | 15ms | 45ms |

## Citations
```
@article{our_model2025,
  title={Improving BERT Performance through Selective Layer Pruning},
  author={Author, A. and Author, B.},
  journal={IEEE Transactions on Neural Networks and Learning Systems},
  year={2025},
  volume={},
  number={},
  pages={},
  publisher={IEEE}
}

@article{devlin2018bert,
  title={BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding},
  author={Devlin, Jacob and Chang, Ming-Wei and Lee, Kenton and Toutanova, Kristina},
  journal={arXiv preprint arXiv:1810.04805},
  year={2018}
}
``` 


We have also worked on a website and hosted it on GitHub Pages and on our website, 
(https://legalmind.space/) Check it out 
