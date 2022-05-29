import React from 'react'
import axios from 'axios'
import Box from '@mui/material/Box';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FavoriteIcon from '@mui/icons-material/Favorite';
import {Toaster, toast} from 'react-hot-toast'



const Input = styled('input')({
  display: 'none',
});

const actions = [
  { icon: <FileCopyIcon />, name: 'Copy' },
  { icon: <SaveIcon />, name: 'Save' },
  { icon: <PrintIcon />, name: 'Print' },
  { icon: <ShareIcon />, name: 'Share' },
];

export default function FaceSwapper() {
  const [selectedSrcImage, setSelectedSrcImage] = useState(null);  
  const [selectedDestImage, setSelectedDestImage] = useState(null); 
  const [resultImage, setResultImage] = useState(null);  
  const [activeStep, setActiveStep] = React.useState(0);

  const steps = [
    {
      label: 'Source image',
      description: 
      <>
        <div className='upload-container'>
          <label>Paste image here...</label>
          <br/>
          <label id="ext">Only JPG and PNG.</label>
          {selectedSrcImage && (
          <div>
            <img alt="not fount" width={"250px"} src={URL.createObjectURL(selectedSrcImage)} />
          </div>
          )}
          <Stack className='upload_button'>
            <label htmlFor="contained-button-file">
              <Input accept="image/*" id="contained-button-file" multiple type="file" 
                    name="myImage"
                    onChange={(event) => {
                      console.log(event.target.files[0]);
                      setSelectedSrcImage(event.target.files[0]);
            }}  />
              <Button variant="contained"  component="span" style={{backgroundColor: "#EEB902"}}>
                Upload
              </Button>
            </label>
          </Stack>
      </div>
      </>
      ,
    },
    {
      label: 'Destination image',
      description:
      <>
      <div className='upload-container'>
        <label>Paste image here...</label>
        <br/>
        <label id="ext">Only JPG and PNG.</label>
        {selectedDestImage && (
        <div>
          <img alt="not fount" width={"250px"} src={URL.createObjectURL(selectedDestImage)} />
        </div>
        )}
        <Stack className='upload_button'>
          <label htmlFor="contained-button-file">
            <Input accept="image/*" id="contained-button-file" multiple type="file" 
                  name="myImage"
                  onChange={(event) => {
                    console.log(event.target.files[0]);
                    setSelectedDestImage(event.target.files[0]);
          }}  />
            <Button variant="contained"  component="span" style={{backgroundColor: "#EEB902"}}>
              Upload
            </Button>
          </label>
        </Stack>
    </div>
    </>
      ,
    },

    {
      label: 'Result',
      description: 
      <>
      <Box className='images-container'>
        <div className='faces-conatiner'>
          {selectedSrcImage && (
            <img
            id='source-image'
            src={URL.createObjectURL(selectedSrcImage)}
            alt="source"
          />
              )}
          {selectedDestImage && (
            <img
            id='destination-image'
            src={URL.createObjectURL(selectedDestImage)}
            alt="destination"
          />
              )}
        </div>
        <img className='arrow' src={require('../images/arrow.gif')} alt="arrow" />  
        <Card sx={{ width: 370, maxHeight: 500, borderRadius: 20, ml : 10 }}>
          {resultImage && (
          <CardMedia
            component="img"
            height="420"
            image={URL.createObjectURL(resultImage)}
            alt="Result"
          />
          )}
          <CardActions disableSpacing sx={{justifyContent: 'center'}}>
            <IconButton aria-label="add to favorites">
              <FavoriteIcon />
            </IconButton>
            <IconButton aria-label="share">
              <ShareIcon />
            </IconButton>
          </CardActions>
        </Card>
      </Box>
      </>
    },
  ];

  const handleNext = () => {
    if(activeStep===1){
      handleResult()
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleAlert=(step)=>{
    if(step==0)
      if(selectedSrcImage===null)
        toast.error('upload source image first!')
      else
          handleNext();
    if(step==1)
        if(selectedDestImage===null)
          toast.error('upload destination image first!')
        else
          handleNext();
    if(step==2){
      toast('Good Job!', {
        icon: '👏',
      });
      handleNext() ;}
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleResult = () => {
      const formData = new FormData()
      formData.append('srcFile', selectedSrcImage)
      formData.append('destFile', selectedDestImage)
      fetch("http://127.0.0.1:5000/swapper", {
      method: "POST",
      body: formData
    })
    .then(res => res.blob())
    .then(image => {
            setResultImage(image)
            console.log('image=', image);
        }) 
    .catch(error => {
        console.error(error);
      });
  }


  return (
    <>
    <Toaster 
      position="top-right"
      reverseOrder={true}/>
    <Box className='stepper-container'>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} 
          sx={{
            '& .MuiStepLabel-root .Mui-completed': {
              color: '#97CC04', // circle color (COMPLETED)
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: '#97CC04', // circle color (ACTIVE)
            },
            '& .MuiStepLabel-label .Mui-active .MuiStepLabel-alternativeLabel':
              {
                color: 'black', // Just text label (ACTIVE)
              },
            '& .MuiStepLabel-root .Mui-active .MuiStepIcon-text': {
              fill: 'white', // circle's number (ACTIVE)
            },
          }}>
            <StepLabel 
              optional={
                index === 2 ? (
                  <Typography variant="caption">Last step</Typography>
                ) : null
              }
            >
              {step.label}
            </StepLabel>
            <StepContent>
              <div>{step.description}</div>
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button style={{backgroundColor: "#97CC04"}}
                    variant="contained"
                    onClick={()=>{handleAlert(index);}}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length && (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
          <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
            Reset
          </Button>
        </Paper>
      )}
    </Box>
  </>
  )
}


