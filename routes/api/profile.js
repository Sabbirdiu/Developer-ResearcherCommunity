const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');

const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

//@route        GET api/profile/me
//@desc         Get current user profile
//@access        public

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    });

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    // only populate from user document if profile exists
    res.json(profile.populate('user', ['name', 'avatar']));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
//@route        POST api/profile
//@desc         create or update user profile
//@access        public

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'skills is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubuser,
      skills,
      youtube,
      facebook,
      twitter,
      instragram,
      linkedin
    } = req.body;
    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubuser) profileFields.githubuser = githubuser;
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    //Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instragram) profileFields.social.instragram = instragram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //update the profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // create the profile
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
//@route        GET api/profile
//@desc         Get all profiles
//@access        public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
//@route        GET api/profile/user/:
//@desc         Get  profile by user id
//@access        public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'profile not found' });
    }
    res.status(500).send('Server Error');
  }
});
//@route        Delete api/profile
//@desc         Delete  profile user post
//@access        private
router.delete('/', auth, async (req, res) => {
  try {
    //remove user from post
    await Post.deleteMany({ user: req.user.id });
    ///remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //Remmove user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User Deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
//@route        Put api/profile/experience
//@desc         add  profile experience
//@access        private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'title is required')
        .not()
        .isEmpty(),
      check('company', 'company is required')
        .not()
        .isEmpty(),
      check('from', 'from date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;
    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

//@route        Put api/profile/experienece/:exp_id
//@desc         delete  profile experience
//@access        private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route        Put api/profile/education
//@desc         add  profile education
//@access        private
router.put(
  '/education',
  [
    auth,
    [
      check('college', 'college is required')
        .not()
        .isEmpty(),
      check('univarsity', 'univarsity is required')
        .not()
        .isEmpty(),
      check('fieldofstudy', 'field of study is required')
        .not()
        .isEmpty(),
      check('from', 'from is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      college,
      univarsity,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;
    const newEdu = {
      college,
      univarsity,
      fieldofstudy,

      from,
      to,
      current,
      description
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);
//@route        Put api/profile/education/:edu_id
//@desc         delete  profile education
//@access        private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    //get remove index
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);
    profile.education.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route        GET api/profile/github/:username
//@desc         get user repos
//@access       public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    };
    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github Profile found' });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;
