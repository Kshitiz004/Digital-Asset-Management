# AWS S3 Configuration Guide

## ⚠️ Important

**You have TWO options for file uploads:**

1. **Option A**: Configure AWS S3 (Cloud Storage) - Recommended for production
2. **Option B**: Use local file storage (for testing without AWS)

---

## Option A: Configure AWS S3 (Recommended)

### Step 1: Create AWS Account
1. Go to https://aws.amazon.com
2. Click "Create Account" or "Sign In"
3. Complete registration

### Step 2: Create S3 Bucket
1. Sign in to AWS Console
2. Search for "S3" in services
3. Click "Create bucket"
4. Settings:
   - **Bucket name**: `dam-assets-bucket` (or your choice)
   - **Region**: `us-east-1`
   - **Block all public access**: Keep checked
   - **Bucket Versioning**: Enable (optional)
5. Click "Create bucket"

### Step 3: Create IAM User
1. Search for "IAM" in services
2. Click "Users" → "Create user"
3. Enter username: `dam-upload-user`
4. Click "Next"
5. Select "Attach policies directly"
6. Search and select: `AmazonS3FullAccess`
7. Click "Next" → "Create user"

### Step 4: Get Access Keys
1. Click on the user you just created
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Select "Local code" or "Application running outside AWS"
5. Click "Next" → "Create access key"
6. **SAVE THESE VALUES** (you won't see them again):
   - **Access Key ID**: `AKIA...`
   - **Secret Access Key**: `xxxx...`

### Step 5: Update .env File
Open `dam-backend/.env` and update:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=xxxx...
S3_BUCKET_NAME=dam-assets-bucket
```

### Step 6: Restart Server
```bash
npm run start:dev
```

## Option B: Local File Storage (For Testing)

If you don't want to configure AWS yet, we can modify the code to use local file storage.

**Trade-offs:**
- ✅ No AWS setup needed
- ✅ Works immediately
- ❌ Files stored on your computer only
- ❌ Not suitable for production

Would you like me to implement local storage as an alternative?

---

## Verification

### Test AWS Upload
1. Start server
2. Open frontend: http://localhost:3001
3. Register and login
4. Upload a file
5. Check AWS S3 console - file should appear in your bucket

### Troubleshooting

**Error: "Missing credentials"**
- Check `.env` file has correct values
- Ensure no extra spaces in credentials
- Restart server after updating `.env`

**Error: "Access Denied"**
- Verify IAM user has `AmazonS3FullAccess` policy
- Check bucket name matches in `.env`
- Ensure bucket exists in correct region

**Files not uploading**
- Check bucket name and region in `.env`
- Verify S3 service is operational in your region
- Check AWS console for any errors

---

## Cost Estimation

**AWS S3 Pricing (as of 2025):**
- Storage: ~$0.023 per GB/month
- Requests: ~$0.0004 per 1,000 requests
- **Free Tier**: 5 GB storage for 12 months

For testing: **Almost FREE** ($0-1/month)

---

## Security Best Practices

1. **Never commit `.env` to Git**
2. **Rotate access keys regularly**
3. **Use IAM roles in production** (not access keys)
4. **Enable bucket encryption**
5. **Use presigned URLs** (already implemented)
6. **Set up bucket policies** for access control

---

## Quick Command Reference

```bash
# Update .env with AWS credentials
nano .env  # or use any text editor

# Restart server
npm run start:dev

# Check AWS bucket
aws s3 ls s3://dam-assets-bucket/
```

---

**Need help?** Let me know which option you prefer!


